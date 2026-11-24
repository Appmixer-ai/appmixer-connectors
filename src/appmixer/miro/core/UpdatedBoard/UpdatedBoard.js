'use strict';

const crypto = require('crypto');
const lib = require('../../lib');

/**
 * Every board of the watched team (up to lib.MAX_BOARD_PAGES pages), most recently modified first.
 * @returns {Promise<{boards: object[], complete: boolean}>}
 */
const fetchBoards = async (context) => {

    const teamId = context.properties.teamId || await lib.defaultTeamId(context);
    const boards = [];
    for (let page = 0; page < lib.MAX_BOARD_PAGES; page++) {
        const result = await lib.listBoardsPage(context, { teamId, sort: 'last_modified', offset: page * lib.BOARDS_PAGE_SIZE });
        boards.push(...result.boards);
        if (result.boards.length < lib.BOARDS_PAGE_SIZE || boards.length >= result.total) {
            return { boards, complete: true };
        }
    }
    return { boards, complete: false };
};

/**
 * What a change of the board is detected by. Miro moves `modifiedAt` only when the board content
 * changes: renaming the board, changing its description or its sharing policy leaves it as it was.
 * So the trigger compares the board's own fields as well.
 * @param {object} board
 * @returns {string}
 */
const fingerprint = (board) => {

    const value = JSON.stringify([
        board.name,
        board.description,
        board.modifiedAt,
        board.policy,
        board.project && board.project.id,
        board.owner && board.owner.id
    ]);
    return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
};

module.exports = {

    fingerprint,

    // Miro has no webhooks (the experimental board subscriptions were removed): the trigger polls.
    // The first check remembers a fingerprint of every board; later checks emit the boards whose
    // fingerprint changed. A board seen for the first time is a new board, not an update.
    async tick(context) {

        let lock;
        try {
            lock = await context.lock(context.componentId, { ttl: 2 * 60 * 1000, maxRetryCount: 0 });
        } catch (err) {
            // Another tick is still running.
            return;
        }

        try {
            const state = context.state || {};
            const known = state.boards || {};
            const { boards, complete } = await fetchBoards(context);

            if (state.initialized && !boards.length && Object.keys(known).length) {
                // A degraded empty answer must not forget the boards.
                return;
            }

            const current = {};
            const changed = [];
            for (const board of boards) {
                if (!board || !board.id) {
                    continue;
                }
                const id = String(board.id);
                current[id] = fingerprint(board);
                if (state.initialized && known[id] !== undefined && known[id] !== current[id]) {
                    changed.push(board);
                }
            }

            // The API lists the most recently modified board first: emit the oldest change first.
            for (const board of changed.reverse()) {
                await context.sendJson(board, 'out');
            }

            await context.saveState({
                initialized: true,
                // Boards beyond the page limit keep their last fingerprint.
                boards: complete ? current : { ...known, ...current }
            });
        } finally {
            lock && await lock.unlock();
        }
    },

    // Flow Test Mode: the most recently modified board of the team. Read-only.
    async test(context) {

        const { boards } = await lib.listBoardsPage(context, {
            teamId: context.properties.teamId || await lib.defaultTeamId(context),
            sort: 'last_modified'
        });

        if (boards.length === 0) {
            throw new context.CancelError('No boards found in the team. Create a board in Miro and test again.');
        }

        const modified = boards.find(board => board.modifiedAt !== board.createdAt);
        return context.sendJson(modified || boards[0], 'out');
    }
};
