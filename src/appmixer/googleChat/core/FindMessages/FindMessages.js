'use strict';

const lib = require('../../lib.generated');

// Schema for a single message item
const messageSchema = {
    name: {
        type: 'string',
        title: 'Name'
    },
    sender: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                title: 'Sender.Name'
            },
            type: {
                type: 'string',
                title: 'Sender.Type'
            }
        },
        title: 'Sender'
    },
    createTime: {
        type: 'string',
        title: 'Create Time'
    },
    text: {
        type: 'string',
        title: 'Text'
    },
    thread: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                title: 'Thread.Name'
            }
        },
        title: 'Thread'
    },
    space: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                title: 'Space.Name'
            }
        },
        title: 'Space'
    },
    argumentText: {
        type: 'string',
        title: 'Argument Text'
    },
    formattedText: {
        type: 'string',
        title: 'Formatted Text'
    }
};

module.exports = {
    async receive(context) {

        const { space, filter, outputType } = context.messages.in.content;

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

        const params = {
            pageSize: 1000
        };

        // Add filter parameter if provided
        if (filter?.trim()) {
            params.filter = filter.trim();
        }

        // Ensure space has the correct format
        const spaceId = space.startsWith('spaces/') ? space : `spaces/${space}`;

        // https://developers.google.com/workspace/chat/api/reference/rest/v1/spaces.messages/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://chat.googleapis.com/v1/${spaceId}/messages`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const messages = data.messages || [];

        if (messages.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        await context.log({ step: 'http-request-success', response: data });

        return lib.sendArrayOutput({ context, records: messages, outputType });
    }
};
