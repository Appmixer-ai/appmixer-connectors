
'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: {
        type: 'number',
        title: 'Mailbox ID'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    slug: {
        type: 'string',
        title: 'Slug'
    },
    email: {
        type: 'string',
        title: 'Email'
    },
    createdAt: {
        type: 'string',
        title: 'Created At'
    },
    updatedAt: {
        type: 'string',
        title: 'Updated At'
    },
    _links: {
        type: 'object',
        properties: {
            self: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Self.Href'
                    }
                },
                title: 'Links.Self'
            },
            folders: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Folders.Href'
                    }
                },
                title: 'Links.Folders'
            },
            fields: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Fields.Href'
                    }
                },
                title: 'Links.Fields'
            }
        },
        title: 'Links'
    }
};

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Mailboxes' });
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/mailboxes/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/mailboxes',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        const records = data['_embedded']?.mailboxes || [];
        return await lib.sendArrayOutput({ context, records, outputType });
    }
};
