'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        if (!input.boardId) {
            throw new context.CancelError('Board is required!');
        }
        const boardId = lib.requireId(context, input.boardId, 'Board');

        if (input.content === undefined || input.content === null || input.content === '') {
            throw new context.CancelError('Content is required!');
        }

        const data = lib.compact({
            data: { content: String(input.content), shape: input.shape },
            style: {
                fillColor: input.fillColor,
                textAlign: input.textAlign,
                textAlignVertical: input.textAlignVertical
            },
            // A sticky note takes a width or a height, not both: the other follows from the shape.
            ...lib.placement(context, { x: input.x, y: input.y, width: input.width, parentId: input.parentId })
        });

        const item = await lib.request(context, { method: 'POST', path: '/boards/' + boardId + '/sticky_notes', data });
        return context.sendJson(item, 'out');
    }
};
