'use strict';

const lib = require('../../lib');

/**
 * The connected user's time entries of the watched window, newest created first. One page:
 * more than 100 entries created between two checks are not expected.
 */
const fetchNewest = context => lib.listTimeEntries(context, {
    ...lib.pollWindow(),
    orderBy: '-created_at',
    maxPages: 1
});

module.exports = {

    // The Toggl API has no webhooks: the trigger polls.
    async tick(context) {

        return lib.pollByTimestamp(context, {
            fetch: () => fetchNewest(context),
            field: 'created_at'
        });
    },

    // Flow Test Mode: your most recently created time entry. Read-only.
    async test(context) {

        const entries = await fetchNewest(context);

        if (entries.length === 0) {
            throw new context.CancelError('No time entries found. Track time in Toggl and test again.');
        }

        return context.sendJson(entries[0], 'out');
    }
};
