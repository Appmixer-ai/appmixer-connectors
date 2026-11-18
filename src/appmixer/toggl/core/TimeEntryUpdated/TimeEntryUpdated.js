'use strict';

const lib = require('../../lib');

/**
 * The connected user's time entries of the watched window, most recently updated first.
 */
const fetchNewest = context => lib.listTimeEntries(context, {
    ...lib.pollWindow(),
    orderBy: '-updated_at',
    maxPages: 1
});

// A new entry has updated_at equal to created_at: that is a creation, not an update.
const isUpdate = entry => entry.updated_at !== entry.created_at;

module.exports = {

    // The Toggl API has no webhooks: the trigger polls.
    async tick(context) {

        return lib.pollByTimestamp(context, {
            fetch: () => fetchNewest(context),
            field: 'updated_at',
            accept: isUpdate
        });
    },

    // Flow Test Mode: your most recently updated time entry. Read-only.
    async test(context) {

        const entries = await fetchNewest(context);

        if (entries.length === 0) {
            throw new context.CancelError('No time entries found. Track time in Toggl and test again.');
        }

        return context.sendJson(entries[0], 'out');
    }
};
