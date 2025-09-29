'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: {
        type: 'string',
        title: 'Group Id'
    },
    name: {
        type: 'string',
        title: 'Group Name'
    },
    created_at: {
        type: 'string',
        title: 'Created At'
    },
    updated_at: {
        type: 'string',
        title: 'Updated At'
    }
};

module.exports = {

    async receive(context) {
        const outputType = context.messages.in.content.outputType || 'array';
        const isSource = context.messages.in.content.isSource;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Groups' });
        }

        // Use the groups list endpoint
        const environment = context.config.environment || 'production';
        const baseUrl = environment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/v2/customers/groups`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Square-Version': '2025-08-20'
            }
        });

        let records = data.groups || [];

        if (isSource) {
            return context.sendJson(records, 'out');
        };
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
