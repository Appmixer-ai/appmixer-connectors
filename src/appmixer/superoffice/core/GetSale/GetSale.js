'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { saleId } = context.messages.in.content;

        if (!saleId) {
            throw new context.CancelError('Sale ID is required!');
        }

        const item = await lib.getItem(context, 'sale', saleId);
        return context.sendJson(item, 'out');
    }
};
