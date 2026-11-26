'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        if (!input.boardId) {
            throw new context.CancelError('Board is required!');
        }
        const boardId = lib.requireId(context, input.boardId, 'Board');

        if (!input.title) {
            throw new context.CancelError('Title is required!');
        }

        let dueDate;
        if (input.dueDate) {
            const date = new Date(input.dueDate);
            if (Number.isNaN(date.getTime())) {
                throw new context.CancelError('Due Date must be a date and time.');
            }
            dueDate = date.toISOString();
        }

        const data = lib.compact({
            data: {
                title: input.title,
                description: input.description,
                dueDate,
                assigneeId: input.assigneeId ? String(input.assigneeId).trim() : undefined
            },
            ...lib.placement(context, { x: input.x, y: input.y, width: input.width, parentId: input.parentId })
        });

        const item = await lib.request(context, { method: 'POST', path: '/boards/' + boardId + '/cards', data });
        return context.sendJson(item, 'out');
    }
};
