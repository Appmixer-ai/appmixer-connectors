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
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/audiences',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const items = Array.isArray(data?.data) ? data.data : [];

        // No searching supported yet, so we return all items
        // if (items.length === 0) {
        //     return context.sendJson({}, 'notFound');
        // }

        return lib.sendArrayOutput({
            context,
            records: items,
            outputType
        });
    },

    toSelectArray(data) {
        // Handle both array response and paginated response with data property
        const audiences = Array.isArray(data) ? data : (data.result || data.data || []);

        return audiences.map(audience => ({
            label: audience.name,
            value: audience.id
        }));
    }

};
