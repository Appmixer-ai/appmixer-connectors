'use strict';

const lib = require('../../lib');

const schema = {
    'gid': { 'type': 'string', 'title': 'Tag ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'createdOn': { 'type': 'string', 'title': 'Created On' }
};

module.exports = {
    async receive(context) {

        const { queryName, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tags', value: 'tags' });
        }

        // https://apireference.getresponse.com/#tags
        const params = {};

        if (queryName) {
            params.query = `name:${queryName}`;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.getresponse.com/v3/tags',
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params
        });

        return lib.sendArrayOutput({ context, records: data || [], outputType });
    }
};
