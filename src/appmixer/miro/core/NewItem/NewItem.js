'use strict';

const lib = require('../../lib');

/**
 * All items of the watched board (the API has no sort order, so every check reads the whole board,
 * up to lib.MAX_ITEM_PAGES pages).
 */
const fetchItems = async (context) => {

    const { boardId: rawBoardId, type } = context.properties;
    if (!rawBoardId) {
        throw new context.CancelError('Board is required!');
    }
    const boardId = lib.requireId(context, rawBoardId, 'Board');
    const { items, complete } = await lib.listAllItems(context, boardId, { type });
    if (!complete) {
        await context.log({ step: 'The board has more items than one check reads; items beyond the limit are not watched.' });
    }
    return items;
};

module.exports = {

    // Miro has no webhooks (the experimental board subscriptions were removed): the trigger polls.
    async tick(context) {

        return lib.pollByTimestamp(context, {
            fetch: () => fetchItems(context),
            field: 'createdAt'
        });
    },

    // Flow Test Mode: the most recently created item of the board. Read-only.
    async test(context) {

        const items = (await fetchItems(context))
            .filter(item => item.createdAt)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (items.length === 0) {
            throw new context.CancelError('No items found on the board. Add an item to the board in Miro and test again.');
        }

        return context.sendJson(items[0], 'out');
    }
};
