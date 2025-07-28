'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'profile_count': { 'type': 'integer', 'title': 'Profile Count' }
};

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Lists' });
        }

        let url = 'https://a.klaviyo.com/api/lists/';
        const params = new URLSearchParams();

        if (query) {
            // Filter lists by name
            params.append('filter', `contains(name,"${query}")`);
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            }
        });

        const lists = response.data.data.map(list => ({
            id: list.id,
            name: list.attributes.name,
            description: list.attributes.description || '',
            profile_count: list.attributes.profile_count || 0
        }));

        if (lists.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: lists, outputType });
    }
};
