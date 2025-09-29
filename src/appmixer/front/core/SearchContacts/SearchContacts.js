
'use strict';

const lib = require('../../lib');
const schema = { 'id': { 'type': 'string', 'title': 'Id' }, 'name': { 'type': 'string', 'title': 'Name' }, 'description': { 'type': 'string', 'title': 'Description' }, 'avatar_url': { 'type': 'string', 'title': 'Avatar Url' }, 'is_spammer': { 'type': 'boolean', 'title': 'Is Spammer' }, 'links': { 'type': 'array', 'items': { 'type': 'string' }, 'title': 'Links' }, 'handles': { 'type': 'array', 'items': { 'type': 'object', 'properties': { 'type': { 'type': 'string', 'title': 'Handles.Type' }, 'handle': { 'type': 'string', 'title': 'Handles.Handle' } }, 'required': ['type', 'handle'] }, 'title': 'Handles' }, 'groups': { 'type': 'array', 'items': {}, 'title': 'Groups' }, 'custom_fields': { 'type': 'object', 'properties': { 'plan': { 'type': 'string', 'title': 'Custom Fields.Plan' } }, 'title': 'Custom Fields' }, 'created_at': { 'type': 'number', 'title': 'Created At' }, 'updated_at': { 'type': 'number', 'title': 'Updated At' } };

module.exports = {
    async receive(context) {

        const { q, limit, page_token, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Results' });
        }

        // https://dev.frontapp.com/reference
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api2.frontapp.com/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: {
                q: q,
                limit: limit || 50
            }
        });

        const records = data._results || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
