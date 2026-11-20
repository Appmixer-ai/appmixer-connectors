'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { saleId } = input;

        if (!saleId) {
            throw new context.CancelError('Sale ID is required!');
        }

        await lib.updateItem(context, 'sale', saleId, input);
        return context.sendJson({}, 'out');
    }
};
