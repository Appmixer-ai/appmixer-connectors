'use strict';

const lib = require('../../lib');

// How far back Flow Test Mode looks for an updated ticket.
const TEST_WINDOW = 30 * 24 * 60 * 60 * 1000;

/**
 * Tickets of the primary workspace updated since the given time (ISO 8601). The list is sorted by
 * creation time, not by update, so every page is read (up to lib.MAX_PAGES).
 */
const fetchUpdated = async (context, since, options) => {

    const tickets = await lib.listPages(context, '/tickets', 'tickets', {
        updated_since: since,
        order_type: 'desc'
    }, options);
    return tickets.map(lib.withoutNulls);
};

// A ticket whose only write is its creation is reported by New Ticket, not here.
const isUpdate = ticket => ticket.updated_at !== ticket.created_at;

module.exports = {

    // Freshservice has no API to subscribe to webhooks: the trigger polls.
    async tick(context) {

        return lib.pollUpdates(context, {
            fetch: since => fetchUpdated(context, since),
            accept: isUpdate
        });
    },

    // Flow Test Mode: the most recently updated ticket of the last 30 days. Read-only.
    async test(context) {

        const since = new Date(Date.now() - TEST_WINDOW).toISOString().replace(/\.\d{3}Z$/, 'Z');
        const tickets = (await fetchUpdated(context, since, { maxPages: 1 })).filter(isUpdate);
        if (!tickets.length) {
            throw new context.CancelError('No tickets updated in the last 30 days. Update a ticket in Freshservice and test again.');
        }
        const latest = tickets.reduce((newest, ticket) => (ticket.updated_at > newest.updated_at ? ticket : newest));
        return context.sendJson(latest, 'out');
    }
};
