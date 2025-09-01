
'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    id: {
        type: 'string',
        title: 'Product Id'
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
            slug: {
                type: 'string',
                title: 'Attributes.Slug'
            },
            description: {
                type: 'string',
                title: 'Attributes.Description'
            },
            status: {
                type: 'string',
                title: 'Attributes.Status'
            },
            status_formatted: {
                type: 'string',
                title: 'Attributes.Status Formatted'
            },
            thumb_url: {
                type: 'string',
                title: 'Attributes.Thumb Url'
            },
            large_thumb_url: {
                type: 'string',
                title: 'Attributes.Large Thumb Url'
            },
            price: {
                type: 'number',
                title: 'Attributes.Price'
            },
            price_formatted: {
                type: 'string',
                title: 'Attributes.Price Formatted'
            },
            from_price: {
                type: 'null',
                title: 'Attributes.From Price'
            },
            to_price: {
                type: 'null',
                title: 'Attributes.To Price'
            },
            pay_what_you_want: {
                type: 'boolean',
                title: 'Attributes.Pay What You Want'
            },
            buy_now_url: {
                type: 'string',
                title: 'Attributes.Buy Now Url'
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
            variants: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Variants.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Variants.Links.Self'
                            }
                        },
                        title: 'Relationships.Variants.Links'
                    }
                },
                title: 'Relationships.Variants'
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

        const { storeId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Products' });
        }

        // Build URL with optional store_id filter
        let url = 'https://api.lemonsqueezy.com/v1/products';
        if (storeId) {
            url += `?filter[store_id]=${storeId}`;
        }

        // https://docs.lemonsqueezy.com/api/products
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        const records = data.data || [];

        // Send to notFound port if no products are found
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
