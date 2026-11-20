'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { title, dueDate, endDate, type } = input;

        if (!title) {
            throw new context.CancelError('Title is required!');
        }
        if (!dueDate) {
            throw new context.CancelError('Due Date is required!');
        }

        const record = await lib.createActivity(context, {
            ...input,
            startDate: dueDate,
            endDate: endDate || dueDate
        }, { type: type || 'inChecklist' });
        return context.sendJson(record, 'out');
    }
};
