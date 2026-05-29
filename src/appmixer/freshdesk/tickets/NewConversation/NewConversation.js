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

        // flowStartedAt: set once on the very first tick. Any conversation created after this
        // timestamp on a ticket we're seeing for the first time is treated as new.
        const flowStartedAt = state.flowStartedAt || new Date().toISOString();
        const isFirstRun = !state.flowStartedAt;

        // knownMaxConvId: { [ticketId]: number } — highest conversation id seen per ticket
        const knownMaxConvId = state.knownMaxConvId || {};
        const newKnownMaxConvId = { ...knownMaxConvId };

        // Step 1: use updated_since to get only recently-updated tickets.
        // A ticket's updated_at bumps when a new conversation is added, so this is precise.
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

            const prevMaxId = knownMaxConvId[ticketId] != null ? knownMaxConvId[ticketId] : null;
            let newMaxId = prevMaxId;

            // Track the highest conv id seen this tick for this ticket
            for (const conv of conversations) {
                if (newMaxId === null || conv.id > newMaxId) {
                    newMaxId = conv.id;
                }
            }

            // Determine which conversations are "new":
            // - If we've seen this ticket before: any conv with id > prevMaxId
            // - If first encounter: any conv created after flowStartedAt (catches the case where
            //   the user adds a conversation right after starting the flow, before the first tick
            //   had a chance to record baseline state for this ticket)
            const isNewConv = (conv) => {
                if (prevMaxId !== null) {
                    return conv.id > prevMaxId;
                }
                // First encounter — only emit conversations created after the flow started
                return conv.created_at >= flowStartedAt;
            };

            // On the very first run ever, just record state without emitting anything —
            // we have no baseline to compare against and don't want to flood with old data.
            if (isFirstRun) {
                newKnownMaxConvId[ticketId] = newMaxId;
                continue;
            }

            // Fetch full ticket for output (lazy, only if we'll actually emit)
            let fullTicket = ticket;
            let fetchedFullTicket = false;

            for (const conv of conversations) {
                if (!isNewConv(conv)) continue;

                // Filter by type
                const isNote = conv.private === true;
                const type = isNote ? 'notes' : 'conversations';
                if (!includeTypes.includes(type)) continue;

                // Filter out ignored agents
                if (ignoredAgentIds.length > 0 && ignoredAgentIds.includes(conv.user_id)) continue;

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
                    conversation: conv,
                    conversationType: isNote ? 'note' : 'reply',
                    conversationsList: conversations,
                    ticket: fullTicket
                }, 'out');
            }

            newKnownMaxConvId[ticketId] = newMaxId;
        }

        await context.saveState({
            flowStartedAt,
            cursorUpdatedAt: maxUpdatedAt || state.cursorUpdatedAt,
            cursorTicketId: maxTicketId,
            knownMaxConvId: newKnownMaxConvId
        });
    }
};
