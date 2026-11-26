'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { companyId } = context.messages.in.content;

        if (!companyId) {
            throw new context.CancelError('Company ID is required!');
        }

        // https://api.upsales.com/ - Company: GET /accounts/{id}
        const { data } = await lib.request(context, { path: '/accounts/' + encodeURIComponent(companyId) });
        return context.sendJson(data.data, 'out');
    }
};
