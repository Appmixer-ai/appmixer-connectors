
'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: {
        type: 'number',
        title: 'Email ID'
    },
    value: {
        type: 'string',
        title: 'Value'
    },
    type: {
        type: 'string',
        title: 'Type'
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
            }
        },
        title: 'Links'
    }
};

module.exports = {
    async receive(context) {

        const { outputType, id } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tags', value: 'tags' });
        }

        // Validate required fields
        if (!id) {
            throw new context.CancelError('Customer ID is required!');
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/customers/emails/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.helpscout.net/v2/customers/${id}/emails`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        const records = data['_embedded']?.emails || [];

        if (context.properties.isSource) {
            return context.sendJson(records, 'out');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    },

    emailsToSelectArray(emails) {
        return emails.map(email => ({
            label: email.value,
            value: email.id
        }));
    }
};
