
'use strict';

const lib = require('../../lib');

// Schema for a single domain item
const schema = {
    id: { type: 'string', title: 'ID' },
    name: { type: 'string', title: 'Name' },
    status: { type: 'string', title: 'Status' },
    created_at: { type: 'string', title: 'Created At' },
    region: { type: 'string', title: 'Region' }
};

module.exports = {
    async receive(context) {
        const { outputType = 'array' } = context.messages.in.content || {};

        // Generate output port options dynamically if requested
        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                outputType,
                schema,
                { label: 'Domains', value: 'result' }
            );
        }

        // Make the API request
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/domains',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Always nested: response.data.data is the domains array
        const items = response.data?.data ?? [];

        // No searching supported yet, so we return all items
        // if (items.length === 0) {
        //     return context.sendJson({}, 'notFound');
        // }

        return lib.sendArrayOutput({
            context,
            records: items,
            outputType
        });
    }
};
