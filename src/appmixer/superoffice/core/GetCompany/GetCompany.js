'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { companyId } = context.messages.in.content;

        if (!companyId) {
            throw new context.CancelError('Company ID is required!');
        }

        const item = await lib.getItem(context, 'company', companyId);
        return context.sendJson(item, 'out');
    }
};
