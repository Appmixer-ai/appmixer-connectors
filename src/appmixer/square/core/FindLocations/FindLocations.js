'use strict';

const lib = require('../../lib.generated');
const schema = { 'id': { 'type': 'string', 'title': 'Id' }, 'name': { 'type': 'string', 'title': 'Name' } };

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Locations' });
        }

        const environment = context.config.environment || 'production';
        const baseUrl = environment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        // https://developer.squareup.com/reference/square/locations-api/list-locations
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/v2/locations`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Accept': 'application/json',
                'Square-Version': '2025-08-20'
            }
        });

        const records = data.locations || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
