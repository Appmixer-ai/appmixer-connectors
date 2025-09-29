'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'address': { 'type': 'string', 'title': 'Address' },
    'type': { 'type': 'string', 'title': 'Type' },
    'send_as': { 'type': 'string', 'title': 'Send As' },
    'settings': { 'type': 'object', 'title': 'Settings' }
};

module.exports = {
    async receive(context) {
        const { inboxId, outputType } = context.messages.in.content;

        if (!inboxId) {
            throw new context.CancelError('Inbox ID is required.');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Channels', value: 'channels' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/inboxes/${inboxId}/channels`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return lib.sendArrayOutput({ context, records: data._results, outputType });
    }
};
