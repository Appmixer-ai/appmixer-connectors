'use strict';

const lib = require('../../lib');
const schema = { 'id': { 'type': 'string', 'title': 'Id' }, 'object': { 'type': 'string', 'title': 'Object' }, 'created': { 'type': 'number', 'title': 'Created' }, 'owned_by': { 'type': 'string', 'title': 'Owned By' }, 'permissions': { 'type': 'array', 'items': {}, 'title': 'Permissions' } };

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (!outputType) {
            throw new context.CancelError('Output Type is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // https://docs.x.ai/docs/models
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.x.ai/v1/models',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const records = response.data.data;

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
