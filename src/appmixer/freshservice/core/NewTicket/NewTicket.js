'use strict';

const lib = require('../../lib');

/**
 * Tickets of the primary workspace, newest first (the list is sorted by creation time and
 * covers the last 30 days): one page, or back to since when polling.
 */
const fetchNewest = async (context, options) => {

    const tickets = await lib.listPages(context, '/tickets', 'tickets', { order_type: 'desc' }, options);
    return tickets.map(lib.withoutNulls);
};

module.exports = {

    // Freshservice has no API to subscribe to webhooks: the trigger polls.
    async tick(context) {

        return lib.pollByTimestamp(context, {
            fetch: since => fetchNewest(context, lib.pagesSince('created_at', since)),
            field: 'created_at'
        });
    },

    // Flow Test Mode: the most recently created ticket. Read-only.
    async test(context) {

        const tickets = await fetchNewest(context, { maxPages: 1, pageSize: 1 });
        if (!tickets.length) {
            throw new context.CancelError('No tickets created in the last 30 days. Create a ticket in Freshservice and test again.');
        }
        return context.sendJson(tickets[0], 'out');
    }
};
