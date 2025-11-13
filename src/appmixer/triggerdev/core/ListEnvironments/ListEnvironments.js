'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Environment ID' },
    'slug': { 'type': 'string', 'title': 'Environment Slug' },
    'type': { 'type': 'string', 'title': 'Environment Type' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Environments' });
        }

        const baseUrl = context.auth.baseUrl || 'https://cloud.trigger.dev';

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/api/v1/environments`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const environments = data.data || [];

        return lib.sendArrayOutput({ context, records: environments, outputType });
    }
};
