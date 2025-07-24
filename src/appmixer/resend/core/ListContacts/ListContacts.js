/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib');

// Schema for a single contact item
const schema = {
    id: { type: 'string', title: 'ID' },
    email: { type: 'string', title: 'Email' },
    first_name: { type: 'string', title: 'First Name' },
    last_name: { type: 'string', title: 'Last Name' },
    created_at: { type: 'string', title: 'Created At' },
    unsubscribed: { type: 'boolean', title: 'Unsubscribed' }
};

module.exports = {

    async receive(context) {
        const { audience_id, outputType = 'array' } = context.messages.in.content || {};

        if (!audience_id) {
            throw new context.CancelError('Audience ID is required!');
        }

        // Generate output port options dynamically if requested
        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                outputType,
                schema,
                { label: 'Contacts', value: 'result' }
            );
        }

        // Make the API request
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.resend.com/audiences/${audience_id}/contacts`,
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
