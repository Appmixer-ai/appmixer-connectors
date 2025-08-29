'use strict';

const lib = require('../../lib');
const schema = { 'id': { 'type': 'string', 'title': 'Tag ID' }, 'name': { 'type': 'string', 'title': 'Name' }, 'tagged_at': { 'type': 'string', 'title': 'Tagged At' } };

module.exports = {
    async receive(context) {

        const { subscriberId, outputType } = context.messages.in.content;
        const { generateOutputPortOptions } = context.properties;

        // Validate required input
        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tags' });
        }

        // https://developers.kit.com/api-reference/subscribers/list-tags-for-a-subscriber
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.kit.com/v4/subscribers/${subscriberId}/tags`,
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            params: {
                per_page: 1000
            }
        });

        return lib.sendArrayOutput({ context, records: data.tags, outputType });
    }
};
