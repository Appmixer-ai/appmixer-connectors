'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (input.heading === undefined || input.heading === null || input.heading === '') {
            throw new context.CancelError('Heading is required!');
        }
        if (input.companyId === undefined || input.companyId === null || input.companyId === '') {
            throw new context.CancelError('Company ID is required!');
        }

        const item = await lib.createItem(context, 'sale', input);
        return context.sendJson(item, 'out');
    }
};
