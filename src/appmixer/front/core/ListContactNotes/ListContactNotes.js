'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'body': { 'type': 'string', 'title': 'Body' },
    'created_at': { 'type': 'number', 'title': 'Created At' },
    'updated_at': { 'type': 'number', 'title': 'Updated At' },
    'author': { 'type': 'object', 'title': 'Author' }
};

module.exports = {
    async receive(context) {
        const { contactId, outputType } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required.');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Notes', value: 'notes' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/contacts/${contactId}/notes`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return lib.sendArrayOutput({ context, records: data._results, outputType });
    }
};
