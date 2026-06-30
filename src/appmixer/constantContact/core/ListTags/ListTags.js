'use strict';

const lib = require('../../lib');

const schema = {
    tag_id: {
        type: 'string',
        title: 'Tag Id'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    contacts_count: {
        type: 'number',
        title: 'Contacts Count'
    },
    created_at: {
        type: 'string',
        title: 'Created At'
    },
    updated_at: {
        type: 'string',
        title: 'Updated At'
    },
    tag_source: {
        type: 'string',
        title: 'Tag Source'
    }
};

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Contact Tags', value: 'contactTags' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.cc.email/v3/contact_tags?limit=500',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        const tags = data.tags || [];

        if (tags.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: tags, outputType });
    },

    tagsToSelectArray(data) {
        const tags = data?.tags || data?.result || (Array.isArray(data) ? data : []);
        return tags.map(tag => ({ label: tag.name, value: tag.tag_id }));
    }
};
