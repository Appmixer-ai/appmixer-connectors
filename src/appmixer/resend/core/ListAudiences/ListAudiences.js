'use strict';

const lib = require('../../lib');

// Schema for a single audience item
const schema = {
    id: { type: 'string', title: 'ID' },
    name: { type: 'string', title: 'Name' },
    created_at: { type: 'string', title: 'Created At' }
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
                { label: 'Audiences', value: 'result' }
            );
        }

        // Make the API request
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/audiences',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const items = response.data && Array.isArray(response.data) ? response.data : [];

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
