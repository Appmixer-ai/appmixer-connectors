'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { loginCustomerId } = context.messages.in.content;

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${lib.API_BASE_URL}/customers:listAccessibleCustomers`,
            headers: lib.buildHeaders(context, { loginCustomerId })
        });

        const resourceNames = data.resourceNames || [];

        return context.sendJson({
            resourceNames,
            count: resourceNames.length
        }, 'out');
    }
};
