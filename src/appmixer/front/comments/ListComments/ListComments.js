'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'body': { 'type': 'string', 'title': 'Body' },
    'posted_at': { 'type': 'number', 'title': 'Posted At' },
    'author': { 'type': 'object', 'title': 'Author' }
};

module.exports = {
    async receive(context) {
        const { conversationId, outputType } = context.messages.in.content;

        if (!conversationId) {
            throw new context.CancelError('Conversation ID is required.');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Comments', value: 'comments' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/conversations/${conversationId}/comments`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return lib.sendArrayOutput({ context, records: data._results, outputType });
    }
};
