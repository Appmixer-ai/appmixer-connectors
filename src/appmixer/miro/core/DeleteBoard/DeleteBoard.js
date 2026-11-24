'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (!context.messages.in.content.boardId) {

            throw new context.CancelError('Board is required!');

        }

        const boardId = lib.requireId(context, context.messages.in.content.boardId, 'Board');

        await lib.request(context, { method: 'DELETE', path: '/boards/' + boardId });
        return context.sendJson({}, 'out');
    }
};
