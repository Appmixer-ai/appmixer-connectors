'use strict';
const axios = require('axios');
const { normalizeMultiselectInput } = require('../../lib');

module.exports = {

    async tick(context) {

        const { auth } = context;
        const { ignoreAgents, include } = context.properties;

        // Normalize multiselect inputs
        const ignoredAgentIds = ignoreAgents
            ? normalizeMultiselectInput(ignoreAgents, context, 'Ignore agents').map(Number)
            : [];

        // include: 'conversations', 'notes', or both (default both)
        const includeTypes = include
            ? normalizeMultiselectInput(include, context, 'Include')
            : ['conversations', 'notes'];

        const authConfig = { username: auth.apiKey, password: 'X' };
        const baseUrl = `https://${auth.domain}.freshdesk.com/api/v2`;

        // --- Initialise state ---
        // knownConversations: { [ticketId]: Set<conversationId> }
        const knownConversations = context.state.knownConversations || {};
        const newKnownConversations = {};

        // Step 1: fetch recent tickets (last 100, ordered by updated_at so we catch recently active ones)
        const { data: tickets } = await axios.get(`${baseUrl}/tickets`, {
            auth: authConfig,
            params: { per_page: 100, order_by: 'updated_at', order_type: 'desc' }
        });

        // Step 2: for each ticket fetch conversations
        for (const ticket of tickets) {
            const ticketId = ticket.id;

            let conversations;
            try {
                const { data } = await axios.get(`${baseUrl}/tickets/${ticketId}/conversations`, {
                    auth: authConfig,
                    params: { per_page: 100 }
                });
                conversations = Array.isArray(data) ? data : [];
            } catch (err) {
                // Skip tickets we can't fetch conversations for (e.g. deleted)
                continue;
            }

            const knownIds = new Set(knownConversations[ticketId] || []);
            const currentIds = new Set();
            const newOnes = [];

            for (const conv of conversations) {
                currentIds.add(conv.id);
                if (knownIds.size > 0 && !knownIds.has(conv.id)) {
                    newOnes.push(conv);
                }
            }

            // Persist current IDs for this ticket
            newKnownConversations[ticketId] = Array.from(currentIds);

            // On first run (no known state for this ticket), just record — don't fire
            if (knownIds.size === 0) continue;

            for (const conv of newOnes) {
                // Filter by type: private notes have private=true, replies/conversations have private=false
                const isNote = conv.private === true;
                const type = isNote ? 'notes' : 'conversations';
                if (!includeTypes.includes(type)) continue;

                // Filter out ignored agents
                if (ignoredAgentIds.length > 0 && ignoredAgentIds.includes(conv.user_id)) continue;

                // Fetch full ticket details
                let fullTicket = ticket;
                try {
                    const { data: ticketDetail } = await axios.get(`${baseUrl}/tickets/${ticketId}`, {
                        auth: authConfig
                    });
                    fullTicket = ticketDetail;
                } catch (err) {
                    // fallback to summary ticket
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
        }

        await context.saveState({ knownConversations: newKnownConversations });
    }
};
