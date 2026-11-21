'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        if (!input.boardId) {
            throw new context.CancelError('Board is required!');
        }
        const boardId = lib.requireId(context, input.boardId, 'Board');
        if (!input.startItemId) {
            throw new context.CancelError('Start Item is required!');
        }
        const startItemId = lib.requireId(context, input.startItemId, 'Start Item');
        if (!input.endItemId) {
            throw new context.CancelError('End Item is required!');
        }
        const endItemId = lib.requireId(context, input.endItemId, 'End Item');

        const data = lib.compact({
            startItem: { id: decodeURIComponent(startItemId) },
            endItem: { id: decodeURIComponent(endItemId) },
            shape: input.shape,
            style: {
                strokeColor: input.strokeColor,
                strokeStyle: input.strokeStyle,
                startStrokeCap: input.startStrokeCap,
                endStrokeCap: input.endStrokeCap
            }
        });
        if (input.caption) {
            data.captions = [{ content: String(input.caption) }];
        }

        const connector = await lib.request(context, { method: 'POST', path: '/boards/' + boardId + '/connectors', data });
        return context.sendJson(connector, 'out');
    }
};
