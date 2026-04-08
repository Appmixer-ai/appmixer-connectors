'use strict';
const axios = require('axios');
const { normalizeMultiselectInput } = require('../../lib');

module.exports = {

    async tick(context) {

        const { auth } = context;
        const { ignoreAgents, include } = context.properties;

        const ignoredAgentIds = ignoreAgents
            ? normalizeMultiselectInput(ignoreAgents, context, 'Ignore agents').map(Number)
            : [];

        const includeTypes = include
            ? normalizeMultiselectInput(include, context, 'Include')
            : ['conversations', 'notes'];

        const state = context.state || {};
        const lookbackMs = 2 * 60 * 1000;

        const baseUrl = `https://${auth.domain}.freshdesk.com/api/v2`;
        const authConfig = { username: auth.apiKey, password: 'X' };

        // knownConversations: { [ticketId]: number } — last known max conversation id per ticket
        const knownMaxConvId = state.knownMaxConvId || {};
        const newKnownMaxConvId = { ...knownMaxConvId };

        // Step 1: use updated_since to get only recently-updated tickets
        // A ticket's updated_at bumps when a new conversation is added, so this is precise
        const cursorUpdatedAt = state.cursorUpdatedAt
            ? new Date(state.cursorUpdatedAt)
            : new Date(Date.now() - lookbackMs);

        const from = new Date(cursorUpdatedAt.getTime() - lookbackMs).toISOString();

        let nextUrl =
            `${baseUrl}/tickets?updated_since=${encodeURIComponent(from)}` +
            '&order_by=updated_at&order_type=asc&per_page=100';

        let maxUpdatedAt = state.cursorUpdatedAt || null;
        let maxTicketId = state.cursorTicketId || 0;

        const updatedTickets = [];

        while (nextUrl) {
            const res = await axios.get(nextUrl, {
                auth: authConfig,
                validateStatus: s => s >= 200 && s < 300
            });
            const tickets = res.data || [];

            for (const ticket of tickets) {
                const updatedAt = ticket.updated_at;
                const ticketId = ticket.id;

                const isAfterCursor =
                    !state.cursorUpdatedAt ||
                    updatedAt > state.cursorUpdatedAt ||
                    (updatedAt === state.cursorUpdatedAt && ticketId > (state.cursorTicketId || 0));

                if (isAfterCursor) {
                    updatedTickets.push(ticket);

                    if (
                        !maxUpdatedAt ||
                        updatedAt > maxUpdatedAt ||
                        (updatedAt === maxUpdatedAt && ticketId > maxTicketId)
                    ) {
                        maxUpdatedAt = updatedAt;
                        maxTicketId = ticketId;
                    }
                }
            }

            const link = res.headers.link || '';
            const match = link.match(/<([^>]+)>;\s*rel="next"/);
            nextUrl = match ? match[1] : null;
        }

        // Step 2: for each recently-updated ticket, fetch conversations and detect new ones
        for (const ticket of updatedTickets) {
            const ticketId = ticket.id;

            let conversations;
            try {
                const { data } = await axios.get(`${baseUrl}/tickets/${ticketId}/conversations`, {
                    auth: authConfig,
                    params: { per_page: 100 }
                });
                conversations = Array.isArray(data) ? data : [];
            } catch (err) {
                continue;
            }

            const prevMaxId = knownMaxConvId[ticketId] || null;
            let newMaxId = prevMaxId;

            // Track the highest conv id seen this tick for this ticket
            for (const conv of conversations) {
                if (!newMaxId || conv.id > newMaxId) {
                    newMaxId = conv.id;
                }
            }

            // On first encounter (no cursor for this ticket), just record state — don't fire
            if (prevMaxId === null) {
                newKnownMaxConvId[ticketId] = newMaxId;
                continue;
            }

            // Fetch full ticket for output
            let fullTicket = ticket;
            let fetchedFullTicket = false;

            for (const conv of conversations) {
                if (conv.id <= prevMaxId) continue;

                // Filter by type
                const isNote = conv.private === true;
                const type = isNote ? 'notes' : 'conversations';
                if (!includeTypes.includes(type)) continue;

                // Filter out ignored agents
                if (ignoredAgentIds.length > 0 && ignoredAgentIds.includes(conv.user_id)) continue;

                // Lazy-fetch full ticket detail once per ticket (only if we'll actually emit)
                if (!fetchedFullTicket) {
                    try {
                        const { data: ticketDetail } = await axios.get(`${baseUrl}/tickets/${ticketId}`, {
                            auth: authConfig
                        });
                        fullTicket = ticketDetail;
                    } catch (err) {
                        // fallback to summary
                    }
                    fetchedFullTicket = true;
                }

                await context.sendJson({
                    conversationId: conv.id,
                    conversationType: isNote ? 'note' : 'reply',
                    conversationBody: conv.body_text || conv.body,
                    conversationCreatedAt: conv.created_at,
                    conversationUserId: conv.user_id,
                    conversationPrivate: conv.private,
                    conversationJson: conv,
                    conversationsList: conversations,
                    ticketId: fullTicket.id,
                    ticketSubject: fullTicket.subject,
                    ticketStatus: fullTicket.status,
                    ticketPriority: fullTicket.priority,
                    ticketAgentId: fullTicket.responder_id,
                    ticketCreatedAt: fullTicket.created_at,
                    ticketUpdatedAt: fullTicket.updated_at,
                    ticketJson: fullTicket
                }, 'out');
            }

            newKnownMaxConvId[ticketId] = newMaxId;
        }

        await context.saveState({
            cursorUpdatedAt: maxUpdatedAt || state.cursorUpdatedAt,
            cursorTicketId: maxTicketId,
            knownMaxConvId: newKnownMaxConvId
        });
    }
};
