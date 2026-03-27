'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        lib.getGoogleAdsConfig(context);

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${lib.API_BASE_URL}/customers:listAccessibleCustomers`,
            headers: lib.buildHeaders(context)
        });

        const resourceNames = data.resourceNames || [];

        return context.sendJson({
            resourceNames,
            count: resourceNames.length
        }, 'out');
    }
};
