'use strict';

const lib = require('../../lib.generated');
const schema = { 'id': { 'type': 'string', 'title': 'Id' }, 'given_name': { 'type': 'string', 'title': 'Given Name' }, 'family_name': { 'type': 'string', 'title': 'Family Name' } };

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers' });
        }

        const params = {};
        if (query) {
            params.query = {
                filter: {
                    text: {
                        exact: query
                    }
                }
            };
        }

        const environment = context.config.environment || 'production';
        const baseUrl = environment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        // https://developer.squareup.com/reference/square/customers-api/search-customers
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${baseUrl}/v2/customers/search`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Square-Version': '2025-08-20'
            },
            data: params
        });

        const records = data.customers || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
