'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    id: {
        type: 'string',
        title: 'Contact Id'
    },
    workspace_id: {
        type: 'string',
        title: 'Workspace Id'
    },
    external_id: {
        type: 'string',
        title: 'Contact External Id'
    },
    role: {
        type: 'string',
        title: 'Role'
    },
    email: {
        type: 'string',
        title: 'Email'
    },
    phone: {
        type: 'string',
        title: 'Phone'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    avatar: {
        type: 'string',
        title: 'Avatar'
    },
    owner_id: {
        type: 'string',
        title: 'Owner Id'
    },
    marked_email_as_spam: {
        type: 'boolean',
        title: 'Marked Email As Spam'
    },
    unsubscribed_from_emails: {
        type: 'boolean',
        title: 'Unsubscribed From Emails'
    },
    created_at: {
        type: 'number',
        title: 'Created At'
    },
    updated_at: {
        type: 'number',
        title: 'Updated At'
    }
};

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Contacts' });
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

        // https://developers.intercom.com/reference#search-contacts
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/contacts/search',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        const records = data.data || [];

        if (records.length === 0) {
            await context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
