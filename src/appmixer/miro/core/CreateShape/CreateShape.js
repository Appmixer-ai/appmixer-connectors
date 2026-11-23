'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        if (!input.boardId) {
            throw new context.CancelError('Board is required!');
        }
        const boardId = lib.requireId(context, input.boardId, 'Board');

        const data = lib.compact({
            data: { shape: input.shape || 'rectangle', content: input.content },
            style: {
                fillColor: input.fillColor,
                borderColor: input.borderColor,
                color: input.color
            },
            ...lib.placement(context, input)
        });

        const item = await lib.request(context, { method: 'POST', path: '/boards/' + boardId + '/shapes', data });
        return context.sendJson(item, 'out');
    }
};
