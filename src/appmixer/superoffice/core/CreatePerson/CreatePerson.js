'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (input.companyId === undefined || input.companyId === null || input.companyId === '') {
            throw new context.CancelError('Company ID is required!');
        }
        if (input.lastName === undefined || input.lastName === null || input.lastName === '') {
            throw new context.CancelError('Last Name is required!');
        }

        const item = await lib.createItem(context, 'person', input);
        return context.sendJson(item, 'out');
    }
};
