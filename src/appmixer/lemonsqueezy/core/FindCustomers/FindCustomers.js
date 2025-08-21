
'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    id: {
        type: 'string',
        title: 'Customer Id'
    },
    attributes: {
        type: 'object',
        properties: {
            store_id: {
                type: 'number',
                title: 'Attributes.Store Id'
            },
            name: {
                type: 'string',
                title: 'Attributes.Name'
            },
            email: {
                type: 'string',
                title: 'Attributes.Email'
            },
            status: {
                type: 'string',
                title: 'Attributes.Status'
            },
            city: {
                type: 'null',
                title: 'Attributes.City'
            },
            region: {
                type: 'null',
                title: 'Attributes.Region'
            },
            country: {
                type: 'string',
                title: 'Attributes.Country'
            },
            total_revenue_currency: {
                type: 'number',
                title: 'Attributes.Total Revenue Currency'
            },
            mrr: {
                type: 'number',
                title: 'Attributes.Mrr'
            },
            status_formatted: {
                type: 'string',
                title: 'Attributes.Status Formatted'
            },
            country_formatted: {
                type: 'string',
                title: 'Attributes.Country Formatted'
            },
            total_revenue_currency_formatted: {
                type: 'string',
                title: 'Attributes.Total Revenue Currency Formatted'
            },
            mrr_formatted: {
                type: 'string',
                title: 'Attributes.Mrr Formatted'
            },
            urls: {
                type: 'object',
                properties: {
                    customer_portal: {
                        type: 'string',
                        title: 'Attributes.Urls.Customer Portal'
                    }
                },
                title: 'Attributes.Urls'
            },
            created_at: {
                type: 'string',
                title: 'Attributes.Created At'
            },
            updated_at: {
                type: 'string',
                title: 'Attributes.Updated At'
            },
            test_mode: {
                type: 'boolean',
                title: 'Attributes.Test Mode'
            }
        },
        title: 'Attributes'
    },
    relationships: {
        type: 'object',
        properties: {
            store: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Store.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Store.Links.Self'
                            }
                        },
                        title: 'Relationships.Store.Links'
                    }
                },
                title: 'Relationships.Store'
            },
            orders: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Orders.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Orders.Links.Self'
                            }
                        },
                        title: 'Relationships.Orders.Links'
                    }
                },
                title: 'Relationships.Orders'
            },
            subscriptions: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Subscriptions.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Subscriptions.Links.Self'
                            }
                        },
                        title: 'Relationships.Subscriptions.Links'
                    }
                },
                title: 'Relationships.Subscriptions'
            },
            'license-keys': {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.License-Keys.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.License-Keys.Links.Self'
                            }
                        },
                        title: 'Relationships.License-Keys.Links'
                    }
                },
                title: 'Relationships.License-Keys'
            }
        },
        title: 'Relationships'
    },
    links: {
        type: 'object',
        properties: {
            self: {
                type: 'string',
                title: 'Links.Self'
            }
        },
        title: 'Links'
    }
};

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers' });
        }

        // Build query parameters
        const params = {};
        if (query) {
            params['filter[email]'] = query;
        }

        // https://docs.lemonsqueezy.com/api/customers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.lemonsqueezy.com/v1/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            params
        });

        const records = data.data || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
