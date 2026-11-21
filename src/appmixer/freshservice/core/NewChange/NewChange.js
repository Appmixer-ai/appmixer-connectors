'use strict';

const lib = require('../../lib');

/**
 * Changes of the primary workspace, newest created first: one page, or back to since when polling.
 */
const fetchNewest = async (context, options) => {

    const changes = await lib.listPages(context, '/changes', 'changes', {
        order_by: 'created_at',
        order_type: 'desc'
    }, options);
    return changes.map(lib.withoutNulls);
};

module.exports = {

    // Freshservice has no API to subscribe to webhooks: the trigger polls.
    async tick(context) {

        return lib.pollByTimestamp(context, {
            fetch: since => fetchNewest(context, lib.pagesSince('created_at', since)),
            field: 'created_at'
        });
    },

    // Flow Test Mode: the most recently created change. Read-only.
    async test(context) {

        const changes = await fetchNewest(context, { maxPages: 1, pageSize: 1 });
        if (!changes.length) {
            throw new context.CancelError('No changes found. Create a change in Freshservice and test again.');
        }
        return context.sendJson(changes[0], 'out');
    }
};
