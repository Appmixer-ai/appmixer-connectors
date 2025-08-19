
'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    id: {
        type: 'string',
        title: 'Store Id'
    },
    attributes: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                title: 'Attributes.Name'
            },
            slug: {
                type: 'string',
                title: 'Attributes.Slug'
            },
            domain: {
                type: 'string',
                title: 'Attributes.Domain'
            },
            url: {
                type: 'string',
                title: 'Attributes.Url'
            },
            avatar_url: {
                type: 'string',
                title: 'Attributes.Avatar Url'
            },
            plan: {
                type: 'string',
                title: 'Attributes.Plan'
            },
            country: {
                type: 'string',
                title: 'Attributes.Country'
            },
            country_nicename: {
                type: 'string',
                title: 'Attributes.Country Nicename'
            },
            currency: {
                type: 'string',
                title: 'Attributes.Currency'
            },
            total_sales: {
                type: 'number',
                title: 'Attributes.Total Sales'
            },
            total_revenue: {
                type: 'number',
                title: 'Attributes.Total Revenue'
            },
            thirty_day_sales: {
                type: 'number',
                title: 'Attributes.Thirty Day Sales'
            },
            thirty_day_revenue: {
                type: 'number',
                title: 'Attributes.Thirty Day Revenue'
            },
            created_at: {
                type: 'string',
                title: 'Attributes.Created At'
            },
            updated_at: {
                type: 'string',
                title: 'Attributes.Updated At'
            }
        },
        title: 'Attributes'
    },
    relationships: {
        type: 'object',
        properties: {
            products: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Products.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Products.Links.Self'
                            }
                        },
                        title: 'Relationships.Products.Links'
                    }
                },
                title: 'Relationships.Products'
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
            discounts: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Discounts.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Discounts.Links.Self'
                            }
                        },
                        title: 'Relationships.Discounts.Links'
                    }
                },
                title: 'Relationships.Discounts'
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
            },
            webhooks: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Webhooks.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Webhooks.Links.Self'
                            }
                        },
                        title: 'Relationships.Webhooks.Links'
                    }
                },
                title: 'Relationships.Webhooks'
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

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Stores' });
        }

        // https://docs.lemonsqueezy.com/api/stores
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.lemonsqueezy.com/v1/stores',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        const records = data.data || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
