'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { boardId: rawBoardId, itemId: rawItemId } = context.messages.in.content;
        if (!rawBoardId) {
            throw new context.CancelError('Board is required!');
        }
        const boardId = lib.requireId(context, rawBoardId, 'Board');
        if (!rawItemId) {
            throw new context.CancelError('Item is required!');
        }
        const itemId = lib.requireId(context, rawItemId, 'Item');

        const item = await lib.request(context, { path: '/boards/' + boardId + '/items/' + itemId });
        return context.sendJson(item, 'out');
    }
};
