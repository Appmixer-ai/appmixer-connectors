'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { companyId } = input;

        if (!companyId) {
            throw new context.CancelError('Company ID is required!');
        }

        await lib.updateItem(context, 'company', companyId, input);
        return context.sendJson({}, 'out');
    }
};
