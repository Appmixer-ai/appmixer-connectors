'use strict';

const lib = require('../../lib');
const schema = { 'id': { 'type': 'integer', 'title': 'Custom Field ID' }, 'name': { 'type': 'string', 'title': 'Name' }, 'key': { 'type': 'string', 'title': 'Key' }, 'label': { 'type': 'string', 'title': 'Label' } };

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Custom Fields' });
        }

        // https://developers.kit.com/api-reference/custom-fields/list-custom-fields
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.kit.com/v4/custom_fields',
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            params: {
                per_page: 1000
            }
        });

        if (isSource) {
            return context.sendJson({ result: data.custom_fields }, 'out');
        }

        return lib.sendArrayOutput({ context, records: data.custom_fields, outputType });
    },

    toSelectArray({ result }) {

        return result.map(customField => {
            return { label: customField.label, value: customField.key };
        });
    }
};
