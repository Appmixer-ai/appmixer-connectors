'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (input.name === undefined || input.name === null || input.name === '') {
            throw new context.CancelError('Name is required!');
        }

        const item = await lib.createItem(context, 'company', input);
        return context.sendJson(item, 'out');
    }
};
