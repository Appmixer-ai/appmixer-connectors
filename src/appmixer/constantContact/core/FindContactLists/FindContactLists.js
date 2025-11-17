'use strict';

const lib = require('../../lib');

const schema = {
    'list_id': { 'type': 'string', 'title': 'List Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'favorite': { 'type': 'boolean', 'title': 'Favorite' },
    'membership_count': { 'type': 'number', 'title': 'Membership Count' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' },
    'type': { 'type': 'string', 'title': 'Type' }
};

module.exports = {
    async receive(context) {

        const { name, favorite, includeCount, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Lists', value: 'lists' });
        }

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Contact_Lists/getContactLists
        const params = {};

        if (includeCount) {
            params.include_count = 'all';
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.cc.email/v3/contact_lists',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        let lists = data.lists || [];

        // Apply client-side filters since API doesn't support them
        if (name) {
            const nameFilter = name.toLowerCase();
            lists = lists.filter(list => list.name.toLowerCase().includes(nameFilter));
        }

        if (favorite !== undefined) {
            lists = lists.filter(list => list.favorite === favorite);
        }

        if (lists.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: lists, outputType });
    }
};
