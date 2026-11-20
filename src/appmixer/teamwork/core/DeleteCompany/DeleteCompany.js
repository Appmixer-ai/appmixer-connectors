'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { companyId } = context.messages.in.content;
        if (!companyId) {
            throw new context.CancelError('Company is required!');
        }

        await lib.callAPI(context, 'DELETE', `/companies/${encodeURIComponent(companyId)}.json`);

        return context.sendJson({}, 'out');
    }
};
