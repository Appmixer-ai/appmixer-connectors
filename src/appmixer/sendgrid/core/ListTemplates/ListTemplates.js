'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'generation': { 'type': 'string', 'title': 'Generation' },
    'versions': { 'type': 'array', 'items': {}, 'title': 'Versions' }
};

module.exports = {
    async receive(context) {

        const { generations, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Templates' });
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/transactional-templates/retrieve-templates
        const params = {};
        if (generations) {
            params.generations = generations;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.sendgrid.com/v3/templates',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            },
            params
        });

        const records = data.templates || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
