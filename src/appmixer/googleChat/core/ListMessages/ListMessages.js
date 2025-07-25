'use strict';

const lib = require('../../lib.generated');

// Schema for a single message item
const messageSchema = {
    name: { type: 'string', title: 'Name' },
    text: { type: 'string', title: 'Text' },
    createTime: { type: 'string', title: 'Create Time' },
    lastUpdateTime: { type: 'string', title: 'Last Update Time' },
    deleteTime: { type: 'string', title: 'Delete Time' },
    sender: {
        type: 'object',
        properties: {
            name: { type: 'string', title: 'Sender.Name' },
            displayName: { type: 'string', title: 'Sender.Display Name' },
            type: { type: 'string', title: 'Sender.Type' },
            domainId: { type: 'string', title: 'Sender.Domain ID' }
        },
        title: 'Sender'
    },
    space: {
        type: 'object',
        properties: {
            name: { type: 'string', title: 'Space.Name' },
            type: { type: 'string', title: 'Space.Type' },
            singleUserBotDm: { type: 'boolean', title: 'Space.Single User Bot DM' },
            threaded: { type: 'boolean', title: 'Space.Threaded' },
            displayName: { type: 'string', title: 'Space.Display Name' }
        },
        title: 'Space'
    },
    thread: {
        type: 'object',
        properties: {
            name: { type: 'string', title: 'Thread.Name' },
            threadKey: { type: 'string', title: 'Thread.Thread Key' }
        },
        title: 'Thread'
    },
    argumentText: { type: 'string', title: 'Argument Text' },
    fallbackText: { type: 'string', title: 'Fallback Text' },
    clientAssignedMessageId: { type: 'string', title: 'Client Assigned Message ID' }
};

module.exports = {
    async receive(context) {

        const { space, outputType } = context.messages.in.content;

        // Input validation
        if (!space) {
            throw new context.CancelError('Space is required.');
        }

        // Generate output port schema dynamically based on the outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                outputType,
                messageSchema,
                { label: 'Messages' }
            );
        }

        // https://developers.google.com/workspace/chat/api/reference/rest/v1/spaces.messages/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://chat.googleapis.com/v1/${space}/messages`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        const messages = data.messages || [];

        if (messages.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: messages, outputType });
    }
};
