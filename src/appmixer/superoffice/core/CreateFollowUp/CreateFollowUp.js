'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (input.startDate === undefined || input.startDate === null || input.startDate === '') {
            throw new context.CancelError('Start Date is required!');
        }
        if (input.endDate === undefined || input.endDate === null || input.endDate === '') {
            throw new context.CancelError('End Date is required!');
        }

        const item = await lib.createItem(context, 'appointment', input);
        return context.sendJson(item, 'out');
    }
};
