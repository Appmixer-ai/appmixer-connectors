'use strict';

const lib = require('../../lib');

const schema = {
    resource: {
        type: 'string',
        title: 'Resource'
    },
    id: {
        type: 'string',
        title: 'Payment ID'
    },
    mode: {
        type: 'string',
        title: 'Mode'
    },
    status: {
        type: 'string',
        title: 'Status'
    },
    isCancelable: {
        type: 'boolean',
        title: 'Is Cancelable'
    },
    sequenceType: {
        type: 'string',
        title: 'Sequence Type'
    },
    amount: {
        type: 'object',
        properties: {
            value: {
                type: 'string',
                title: 'Amount.Value'
            },
            currency: {
                type: 'string',
                title: 'Amount.Currency'
            }
        },
        title: 'Amount'
    },
    description: {
        type: 'string',
        title: 'Description'
    },
    method: {
        type: 'string',
        title: 'Method'
    },
    metadata: {
        type: 'null',
        title: 'Metadata'
    },
    details: {
        type: 'null',
        title: 'Details'
    },
    profileId: {
        type: 'string',
        title: 'Profile Id'
    },
    redirectUrl: {
        type: 'string',
        title: 'Redirect Url'
    },
    createdAt: {
        type: 'string',
        title: 'Created At'
    },
    expiresAt: {
        type: 'string',
        title: 'Expires At'
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
            checkout: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Checkout.Href'
                    },
                    type: {
                        type: 'string',
                        title: 'Links.Checkout.Type'
                    }
                },
                title: 'Links.Checkout'
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
            }
        },
        title: 'Links'
    }
};

module.exports = {
    async receive(context) {

        const {
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'payments', value: 'payments' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/payments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            },
            params: {
                limit: 250
            }
        });

        const records = data['_embedded']?.payments || data.payments || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
