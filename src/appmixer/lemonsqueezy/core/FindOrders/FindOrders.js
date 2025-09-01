
'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    id: {
        type: 'string',
        title: 'Order Id'
    },
    attributes: {
        type: 'object',
        properties: {
            store_id: {
                type: 'number',
                title: 'Attributes.Store Id'
            },
            customer_id: {
                type: 'number',
                title: 'Attributes.Customer Id'
            },
            identifier: {
                type: 'string',
                title: 'Attributes.Identifier'
            },
            order_number: {
                type: 'number',
                title: 'Attributes.Order Number'
            },
            user_name: {
                type: 'string',
                title: 'Attributes.User Name'
            },
            user_email: {
                type: 'string',
                title: 'Attributes.User Email'
            },
            currency: {
                type: 'string',
                title: 'Attributes.Currency'
            },
            currency_rate: {
                type: 'string',
                title: 'Attributes.Currency Rate'
            },
            subtotal: {
                type: 'number',
                title: 'Attributes.Subtotal'
            },
            setup_fee: {
                type: 'number',
                title: 'Attributes.Setup Fee'
            },
            discount_total: {
                type: 'number',
                title: 'Attributes.Discount Total'
            },
            tax: {
                type: 'number',
                title: 'Attributes.Tax'
            },
            total: {
                type: 'number',
                title: 'Attributes.Total'
            },
            subtotal_usd: {
                type: 'number',
                title: 'Attributes.Subtotal Usd'
            },
            setup_fee_usd: {
                type: 'number',
                title: 'Attributes.Setup Fee Usd'
            },
            discount_total_usd: {
                type: 'number',
                title: 'Attributes.Discount Total Usd'
            },
            tax_usd: {
                type: 'number',
                title: 'Attributes.Tax Usd'
            },
            total_usd: {
                type: 'number',
                title: 'Attributes.Total Usd'
            },
            tax_name: {
                type: 'string',
                title: 'Attributes.Tax Name'
            },
            tax_rate: {
                type: 'string',
                title: 'Attributes.Tax Rate'
            },
            tax_inclusive: {
                type: 'boolean',
                title: 'Attributes.Tax Inclusive'
            },
            status: {
                type: 'string',
                title: 'Attributes.Status'
            },
            status_formatted: {
                type: 'string',
                title: 'Attributes.Status Formatted'
            },
            refunded: {
                type: 'boolean',
                title: 'Attributes.Refunded'
            },
            refunded_at: {
                type: 'null',
                title: 'Attributes.Refunded At'
            },
            subtotal_formatted: {
                type: 'string',
                title: 'Attributes.Subtotal Formatted'
            },
            setup_fee_formatted: {
                type: 'string',
                title: 'Attributes.Setup Fee Formatted'
            },
            discount_total_formatted: {
                type: 'string',
                title: 'Attributes.Discount Total Formatted'
            },
            tax_formatted: {
                type: 'string',
                title: 'Attributes.Tax Formatted'
            },
            total_formatted: {
                type: 'string',
                title: 'Attributes.Total Formatted'
            },
            first_order_item: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                        title: 'Attributes.First Order Item.Id'
                    },
                    order_id: {
                        type: 'number',
                        title: 'Attributes.First Order Item.Order Id'
                    },
                    product_id: {
                        type: 'number',
                        title: 'Attributes.First Order Item.Product Id'
                    },
                    variant_id: {
                        type: 'number',
                        title: 'Attributes.First Order Item.Variant Id'
                    },
                    product_name: {
                        type: 'string',
                        title: 'Attributes.First Order Item.Product Name'
                    },
                    variant_name: {
                        type: 'string',
                        title: 'Attributes.First Order Item.Variant Name'
                    },
                    price: {
                        type: 'number',
                        title: 'Attributes.First Order Item.Price'
                    },
                    created_at: {
                        type: 'string',
                        title: 'Attributes.First Order Item.Created At'
                    },
                    updated_at: {
                        type: 'string',
                        title: 'Attributes.First Order Item.Updated At'
                    },
                    deleted_at: {
                        type: 'null',
                        title: 'Attributes.First Order Item.Deleted At'
                    },
                    test_mode: {
                        type: 'boolean',
                        title: 'Attributes.First Order Item.Test Mode'
                    }
                },
                title: 'Attributes.First Order Item'
            },
            urls: {
                type: 'object',
                properties: {
                    receipt: {
                        type: 'string',
                        title: 'Attributes.Urls.Receipt'
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
            customer: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Customer.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Customer.Links.Self'
                            }
                        },
                        title: 'Relationships.Customer.Links'
                    }
                },
                title: 'Relationships.Customer'
            },
            'order-items': {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Order-Items.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Order-Items.Links.Self'
                            }
                        },
                        title: 'Relationships.Order-Items.Links'
                    }
                },
                title: 'Relationships.Order-Items'
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
            },
            'discount-redemptions': {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Discount-Redemptions.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Discount-Redemptions.Links.Self'
                            }
                        },
                        title: 'Relationships.Discount-Redemptions.Links'
                    }
                },
                title: 'Relationships.Discount-Redemptions'
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

        const { storeId, customerId, userEmail, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Orders' });
        }

        // Build query parameters
        const params = {};
        if (storeId) {
            params['filter[store_id]'] = storeId;
        }
        if (customerId) {
            params['filter[customer_id]'] = customerId;
        }
        if (userEmail) {
            params['filter[user_email]'] = userEmail;
        }

        // https://docs.lemonsqueezy.com/api/orders
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.lemonsqueezy.com/v1/orders',
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
