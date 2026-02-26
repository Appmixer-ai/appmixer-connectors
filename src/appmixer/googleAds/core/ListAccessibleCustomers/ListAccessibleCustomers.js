'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { developerToken, loginCustomerId } = context.messages.in.content;

        lib.ensureRequired(developerToken, 'Developer Token is required!', context);

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${lib.API_BASE_URL}/customers:listAccessibleCustomers`,
            headers: lib.buildHeaders(context, { developerToken, loginCustomerId })
        });

        const resourceNames = data.resourceNames || [];

        return context.sendJson({
            resourceNames,
            count: resourceNames.length
        }, 'out');
    }
};
