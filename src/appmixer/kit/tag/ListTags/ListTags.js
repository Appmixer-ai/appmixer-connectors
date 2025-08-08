'use strict';

const lib = require('../../lib');
const schema = { 'id': { 'type': 'string', 'title': 'Tag ID' }, 'name': { 'type': 'string', 'title': 'Name' }, 'created_at': { 'type': 'string', 'title': 'Created At' } };

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tags' });
        }

        // https://developers.kit.com/api-reference/tags/list-tags
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.kit.com/v4/tags',
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            params: {
                per_page: 1000
            }
        });

        if (isSource) {
            return context.sendJson({ result: data.tags }, 'out');
        }

        return lib.sendArrayOutput({ context, records: data.tags, outputType });
    },

    toSelectArray({ result }) {

        return result.map(tag => {
            return { label: tag.name, value: tag.id };
        });
    }
};
