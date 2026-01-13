'use strict';

const lib = require('../../lib');

const schema = {
    list_id: {
        type: 'string',
        title: 'List Id'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    description: {
        type: 'string',
        title: 'Description'
    },
    favorite: {
        type: 'boolean',
        title: 'Favorite'
    },
    created_at: {
        type: 'string',
        title: 'Created At'
    },
    updated_at: {
        type: 'string',
        title: 'Updated At'
    },
    deleted_at: {
        type: 'string',
        title: 'Deleted At'
    },
    membership_count: {
        type: 'number',
        title: 'Membership Count'
    }
};

module.exports = {
    async receive(context) {

        const { name, status, channelType, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Lists', value: 'lists' });
        }

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Contact_Lists/getContactLists
        const params = {
            name,
            status,
            channel_type: channelType
        };
        const options = {
            method: 'GET',
            url: 'https://api.cc.email/v3/contact_lists',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        };
        const { data } = await context.httpRequest(options);

        let lists = data.lists || [];

        if (lists.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: lists, outputType });
    },

    listsToSelectArray(data) {
        const lists = data?.lists || data?.result || (Array.isArray(data) ? data : []);
        return lists.map(list => ({ label: list.name, value: list.list_id }));
    }
};
