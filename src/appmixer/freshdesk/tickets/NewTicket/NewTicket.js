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

        // Cursor is based on created_at — we only want genuinely new tickets.
        // initialCursorCreatedAt is used as the fallback state so that on the first tick
        // where no new tickets are found, we still persist a cursor and avoid re-emitting
        // updated (but not new) tickets on subsequent ticks.
        const initialCursorCreatedAt = new Date(Date.now() - lookbackMs).toISOString();
        const cursorCreatedAt = state.cursorCreatedAt
            ? new Date(state.cursorCreatedAt)
            : new Date(initialCursorCreatedAt);

        // Use updated_since slightly before the cursor (new tickets have updated_at === created_at)
        const from = new Date(cursorCreatedAt.getTime() - lookbackMs).toISOString();

        const params = new URLSearchParams({
            updated_since: from,
            order_by: 'created_at',
            order_type: 'asc',
            per_page: '100'
        });
        if (normalizedEmbed.length > 0) {
            params.set('include', normalizedEmbed.join(','));
        }

        const isFirstRun = !state.cursorCreatedAt;

        let nextUrl = `${baseUrl}?${params.toString()}`;
        let maxCreatedAt = state.cursorCreatedAt || initialCursorCreatedAt;
        let maxTicketId = state.cursorTicketId || 0;

        while (nextUrl) {
            const res = await axios.get(nextUrl, {
                auth: authConfig,
                validateStatus: s => s >= 200 && s < 300
            });

            const tickets = res.data || [];

            for (const ticket of tickets) {
                const createdAt = ticket.created_at;
                const ticketId = ticket.id;

                // Only emit tickets created after the cursor (tie-break on id)
                // On the first run, skip emission entirely (baseline-only behavior)
                const isNew =
                    !isFirstRun && (
                        createdAt > state.cursorCreatedAt ||
                        (createdAt === state.cursorCreatedAt && ticketId > (state.cursorTicketId || 0))
                    );

                if (!isNew) continue;

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
                    !maxCreatedAt ||
                    createdAt > maxCreatedAt ||
                    (createdAt === maxCreatedAt && ticketId > maxTicketId)
                ) {
                    maxCreatedAt = createdAt;
                    maxTicketId = ticketId;
                }
            }

            const link = res.headers.link || '';
            const match = link.match(/<([^>]+)>;\s*rel="next"/);
            nextUrl = match ? match[1] : null;
        }

        await context.saveState({ cursorCreatedAt: maxCreatedAt, cursorTicketId: maxTicketId });
    }
};
