'use strict';
const axios = require('axios');
const { normalizeMultiselectInput } = require('../../lib');

module.exports = {

    async tick(context) {

        const { auth } = context;
        const { embed } = context.properties;
        const normalizedEmbed = embed
            ? normalizeMultiselectInput(embed, context, 'Embed fields')
            : [];

        const state = context.state || {};
        const lookbackMs = 2 * 60 * 1000;

        const baseUrl = `https://${auth.domain}.freshdesk.com/api/v2/tickets`;
        const authConfig = { username: auth.apiKey, password: 'X' };

        const cursorUpdatedAt = state.cursorUpdatedAt
            ? new Date(state.cursorUpdatedAt)
            : new Date(Date.now() - lookbackMs);

        // Start slightly before the cursor to avoid missing boundary updates
        const from = new Date(cursorUpdatedAt.getTime() - lookbackMs).toISOString();

        const params = new URLSearchParams({
            updated_since: from,
            order_by: 'updated_at',
            order_type: 'asc',
            per_page: '100'
        });
        if (normalizedEmbed.length > 0) {
            params.set('include', normalizedEmbed.join(','));
        }

        let nextUrl = `${baseUrl}?${params.toString()}`;
        let maxUpdatedAt = state.cursorUpdatedAt || null;
        let maxTicketId = state.cursorTicketId || 0;

        while (nextUrl) {
            const res = await axios.get(nextUrl, {
                auth: authConfig,
                validateStatus: s => s >= 200 && s < 300
            });

            const tickets = res.data || [];

            for (const ticket of tickets) {
                const updatedAt = ticket.updated_at;
                const ticketId = ticket.id;

                // Strict cursor check with tie-breaker on id
                const isAfterCursor =
                    !state.cursorUpdatedAt ||
                    updatedAt > state.cursorUpdatedAt ||
                    (updatedAt === state.cursorUpdatedAt && ticketId > (state.cursorTicketId || 0));

                if (!isAfterCursor) continue;

                const fields = {
                    id: ticket.id,
                    createdAt: ticket.created_at,
                    updatedAt: ticket.updated_at,
                    dueBy: ticket.due_by,
                    frDueBy: ticket.fr_due_by,
                    subject: ticket.subject,
                    type: ticket.type,
                    source: ticket.source,
                    sourceInfo: ticket.source_info || null,
                    status: ticket.status,
                    priority: ticket.priority,
                    agentId: ticket.responder_id,
                    groupId: ticket.group_id,
                    emailConfigId: ticket.email_config_id,
                    productId: ticket.product_id,
                    tags: ticket.tags,
                    customFields: ticket.custom_fields,
                    ticketJson: ticket
                };

                if (normalizedEmbed.includes('requester') && ticket.requester) {
                    fields.requesterId = ticket.requester.id;
                    fields.requesterName = ticket.requester.name;
                    fields.requesterEmail = ticket.requester.email;
                }
                if (normalizedEmbed.includes('description')) {
                    fields.description = ticket.description_text;
                }

                await context.sendJson(fields, 'ticket');

                if (
                    !maxUpdatedAt ||
                    updatedAt > maxUpdatedAt ||
                    (updatedAt === maxUpdatedAt && ticketId > maxTicketId)
                ) {
                    maxUpdatedAt = updatedAt;
                    maxTicketId = ticketId;
                }
            }

            const link = res.headers.link || '';
            const match = link.match(/<([^>]+)>;\s*rel="next"/);
            nextUrl = match ? match[1] : null;
        }

        if (maxUpdatedAt) {
            await context.saveState({ cursorUpdatedAt: maxUpdatedAt, cursorTicketId: maxTicketId });
        }
    }
};
