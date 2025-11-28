'use strict';

const lib = require('../../lib');

const schema = {
    resource: {
        type: 'string',
        title: 'Resource'
    },
    id: {
        type: 'string',
        title: 'Customer ID'
    },
    mode: {
        type: 'string',
        title: 'Mode'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    email: {
        type: 'string',
        title: 'Email'
    },
    locale: {
        type: 'string',
        title: 'Locale'
    },
    metadata: {
        type: 'null',
        title: 'Metadata'
    },
    createdAt: {
        type: 'string',
        title: 'Created At'
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
                    },
                    type: {
                        type: 'string',
                        title: 'Links.Self.Type'
                    }
                },
                title: 'Links.Self'
            },
            dashboard: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Dashboard.Href'
                    },
                    type: {
                        type: 'string',
                        title: 'Links.Dashboard.Type'
                    }
                },
                title: 'Links.Dashboard'
            },
            documentation: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Documentation.Href'
                    },
                    type: {
                        type: 'string',
                        title: 'Links.Documentation.Type'
                    }
                },
                title: 'Links.Documentation'
            }
        },
        title: 'Links'
    }
};

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers', value: 'customers' });
        }

        // https://docs.mollie.com/reference/v2/customers-api/list-customers

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            },
            params: {
                limit: 250
            }
        });

        const customers = data['_embedded']?.customers || [];

        return lib.sendArrayOutput({ context, records: customers, outputType });
    }
};
