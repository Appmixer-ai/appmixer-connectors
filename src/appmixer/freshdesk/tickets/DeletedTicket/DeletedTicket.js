'use strict';
const axios = require('axios');

module.exports = {

    async tick(context) {

        const { auth } = context;
        const state = context.state || {};
        const lookbackMs = 2 * 60 * 1000;

        const baseUrl = `https://${auth.domain}.freshdesk.com/api/v2/tickets`;
        const authConfig = { username: auth.apiKey, password: 'X' };

        // Deleted tickets API supports updated_since too (filter=deleted)
        const cursorUpdatedAt = state.cursorUpdatedAt
            ? new Date(state.cursorUpdatedAt)
            : new Date(Date.now() - lookbackMs);

        const from = new Date(cursorUpdatedAt.getTime() - lookbackMs).toISOString();

        const isFirstRun = !state.cursorUpdatedAt;

        let nextUrl =
            `${baseUrl}?filter=deleted` +
            `&updated_since=${encodeURIComponent(from)}` +
            '&order_by=updated_at&order_type=asc&per_page=100';

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

                if (!ticket.deleted) continue;

                // On the first run, skip emission entirely (baseline-only behavior).
                const isAfterCursor =
                    !isFirstRun && (
                        updatedAt > state.cursorUpdatedAt ||
                        (updatedAt === state.cursorUpdatedAt && ticketId > (state.cursorTicketId || 0))
                    );

                if (!isAfterCursor) continue;

                await context.sendJson({
                    id: ticket.id,
                    subject: ticket.subject,
                    deleted_at: ticket.updated_at,
                    ticketJson: ticket
                }, 'ticket');

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

        // Always persist cursor even when no results, to prevent gaps if polling interval exceeds lookback window.
        const cursorToSave = maxUpdatedAt || cursorUpdatedAt.toISOString();
        await context.saveState({ cursorUpdatedAt: cursorToSave, cursorTicketId: maxTicketId });
    }
};
