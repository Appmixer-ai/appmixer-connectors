'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    id: {
        type: 'string',
        title: 'Conversation Id'
    },
    created_at: {
        type: 'number',
        title: 'Created At'
    },
    updated_at: {
        type: 'number',
        title: 'Updated At'
    },
    waiting_since: {
        type: 'number',
        title: 'Waiting Since'
    },
    snoozed_until: {
        type: 'string',
        title: 'Snoozed Until'
    },
    open: {
        type: 'boolean',
        title: 'Open'
    },
    state: {
        type: 'string',
        title: 'State'
    },
    read: {
        type: 'boolean',
        title: 'Read'
    },
    tags: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                title: 'Tags.Type'
            },
            tags: {
                type: 'array',
                items: {},
                title: 'Tags.Tags'
            }
        },
        title: 'Tags'
    },
    priority: {
        type: 'string',
        title: 'Priority'
    },
    title: {
        type: 'string',
        title: 'Title'
    },
    ticket: {
        type: 'string',
        title: 'Ticket'
    }
};

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Conversations' });
        }

        // Parse query for search
        let parsedQuery;
        try {
            parsedQuery = typeof query === 'string' ? JSON.parse(query) : query;
        } catch (error) {
            throw new context.CancelError('Invalid JSON query format. Please provide a valid JSON query object.');
        }

        const requestBody = {
            query: parsedQuery
        };

        // https://developers.intercom.com/reference#search-conversations
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/conversations/search',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        const records = data.conversations || [];

        //if no records found, send to notFound port
        if (records.length === 0) {
            await context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
