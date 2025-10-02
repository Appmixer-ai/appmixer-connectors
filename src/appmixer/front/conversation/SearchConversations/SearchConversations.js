
'use strict';

const lib = require('../../lib');
const schema = { 'id': { 'type': 'string', 'title': 'Id' }, 'subject': { 'type': 'string', 'title': 'Subject' }, 'status': { 'type': 'string', 'title': 'Status' }, 'assignee': { 'type': 'object', 'properties': { 'id': { 'type': 'string', 'title': 'Assignee.Id' }, 'email': { 'type': 'string', 'title': 'Assignee.Email' }, 'name': { 'type': 'string', 'title': 'Assignee.Name' } }, 'title': 'Assignee' }, 'recipient': { 'type': 'object', 'properties': { 'handle': { 'type': 'string', 'title': 'Recipient.Handle' }, 'type': { 'type': 'string', 'title': 'Recipient.Type' } }, 'title': 'Recipient' }, 'tags': { 'type': 'array', 'items': { 'type': 'string' }, 'title': 'Tags' }, 'links': { 'type': 'array', 'items': {}, 'title': 'Links' }, 'is_private': { 'type': 'boolean', 'title': 'Is Private' }, 'draft_mode': { 'type': 'string', 'title': 'Draft Mode' }, 'created_at': { 'type': 'number', 'title': 'Created At' } };

module.exports = {
    async receive(context) {

        const { q, limit, page_token, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Results' });
        }

        // https://dev.frontapp.com/reference
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/conversations',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
