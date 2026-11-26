'use strict';

const lib = require('../../lib');

/**
 * Boards of the watched team, newest created first: one page, or back to `since` when polling.
 */
const fetchNewest = async (context, since) => lib.fetchBoardsSince(context, {
    teamId: context.properties.teamId || await lib.defaultTeamId(context),
    sort: 'last_created',
    field: 'createdAt',
    since
});

module.exports = {

    // Miro has no webhooks (the experimental board subscriptions were removed): the trigger polls.
    async tick(context) {

        return lib.pollByTimestamp(context, {
            fetch: since => fetchNewest(context, since),
            field: 'createdAt'
        });
    },

    // Flow Test Mode: the most recently created board of the team. Read-only.
    async test(context) {

        const boards = await fetchNewest(context);

        if (boards.length === 0) {
            throw new context.CancelError('No boards found in the team. Create a board in Miro and test again.');
        }

        return context.sendJson(boards[0], 'out');
    }
};
