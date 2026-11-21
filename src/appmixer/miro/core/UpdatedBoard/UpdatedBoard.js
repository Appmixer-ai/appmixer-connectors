'use strict';

const lib = require('../../lib');

/**
 * Boards of the watched team, most recently modified first: one page, or back to `since` when polling.
 */
const fetchNewest = async (context, since) => lib.fetchBoardsSince(context, {
    teamId: context.properties.teamId || await lib.defaultTeamId(context),
    sort: 'last_modified',
    field: 'modifiedAt',
    since
});

// A board never modified since its creation has modifiedAt equal to createdAt: that is a creation.
const isUpdate = board => board.modifiedAt !== board.createdAt;

module.exports = {

    // Miro has no webhooks (the experimental board subscriptions were removed): the trigger polls.
    async tick(context) {

        return lib.pollByTimestamp(context, {
            fetch: since => fetchNewest(context, since),
            field: 'modifiedAt',
            accept: isUpdate
        });
    },

    // Flow Test Mode: the most recently modified board of the team. Read-only.
    async test(context) {

        const boards = (await fetchNewest(context)).filter(isUpdate);

        if (boards.length === 0) {
            throw new context.CancelError('No modified boards found in the team. Change a board in Miro and test again.');
        }

        return context.sendJson(boards[0], 'out');
    }
};
