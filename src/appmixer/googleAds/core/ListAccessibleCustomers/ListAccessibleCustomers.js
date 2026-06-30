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

        // Parse resourceNames to extract customer IDs
        // Format: 'customers/{customerId}'
        const customers = resourceNames.map(resourceName => {
            const id = resourceName.replace('customers/', '');
            return {
                id,
                resourceName
            };
        });

        return context.sendJson({
            customers,
            count: customers.length
        }, 'out');
    }
};
