
'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    id: {
        type: 'string',
        title: 'Subscription Id'
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
            order_id: {
                type: 'number',
                title: 'Attributes.Order Id'
            },
            order_item_id: {
                type: 'number',
                title: 'Attributes.Order Item Id'
            },
            product_id: {
                type: 'number',
                title: 'Attributes.Product Id'
            },
            variant_id: {
                type: 'number',
                title: 'Attributes.Variant Id'
            },
            product_name: {
                type: 'string',
                title: 'Attributes.Product Name'
            },
            variant_name: {
                type: 'string',
                title: 'Attributes.Variant Name'
            },
            user_name: {
                type: 'string',
                title: 'Attributes.User Name'
            },
            user_email: {
                type: 'string',
                title: 'Attributes.User Email'
            },
            status: {
                type: 'string',
                title: 'Attributes.Status'
            },
            status_formatted: {
                type: 'string',
                title: 'Attributes.Status Formatted'
            },
            pause: {
                type: 'null',
                title: 'Attributes.Pause'
            },
            cancelled: {
                type: 'boolean',
                title: 'Attributes.Cancelled'
            },
            trial_ends_at: {
                type: 'null',
                title: 'Attributes.Trial Ends At'
            },
            billing_anchor: {
                type: 'number',
                title: 'Attributes.Billing Anchor'
            },
            first_subscription_item: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                        title: 'Attributes.First Subscription Item.Id'
                    },
                    subscription_id: {
                        type: 'number',
                        title: 'Attributes.First Subscription Item.Subscription Id'
                    },
                    price_id: {
                        type: 'number',
                        title: 'Attributes.First Subscription Item.Price Id'
                    },
                    quantity: {
                        type: 'number',
                        title: 'Attributes.First Subscription Item.Quantity'
                    },
                    created_at: {
                        type: 'string',
                        title: 'Attributes.First Subscription Item.Created At'
                    },
                    updated_at: {
                        type: 'string',
                        title: 'Attributes.First Subscription Item.Updated At'
                    }
                },
                title: 'Attributes.First Subscription Item'
            },
            urls: {
                type: 'object',
                properties: {
                    update_payment_method: {
                        type: 'string',
                        title: 'Attributes.Urls.Update Payment Method'
                    },
                    customer_portal: {
                        type: 'string',
                        title: 'Attributes.Urls.Customer Portal'
                    }
                },
                title: 'Attributes.Urls'
            },
            renews_at: {
                type: 'string',
                title: 'Attributes.Renews At'
            },
            ends_at: {
                type: 'null',
                title: 'Attributes.Ends At'
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
            order: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Order.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Order.Links.Self'
                            }
                        },
                        title: 'Relationships.Order.Links'
                    }
                },
                title: 'Relationships.Order'
            },
            'order-item': {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Order-Item.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Order-Item.Links.Self'
                            }
                        },
                        title: 'Relationships.Order-Item.Links'
                    }
                },
                title: 'Relationships.Order-Item'
            },
            product: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Product.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Product.Links.Self'
                            }
                        },
                        title: 'Relationships.Product.Links'
                    }
                },
                title: 'Relationships.Product'
            },
            variant: {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Variant.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Variant.Links.Self'
                            }
                        },
                        title: 'Relationships.Variant.Links'
                    }
                },
                title: 'Relationships.Variant'
            },
            'subscription-items': {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Subscription-Items.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Subscription-Items.Links.Self'
                            }
                        },
                        title: 'Relationships.Subscription-Items.Links'
                    }
                },
                title: 'Relationships.Subscription-Items'
            },
            'subscription-invoices': {
                type: 'object',
                properties: {
                    links: {
                        type: 'object',
                        properties: {
                            related: {
                                type: 'string',
                                title: 'Relationships.Subscription-Invoices.Links.Related'
                            },
                            self: {
                                type: 'string',
                                title: 'Relationships.Subscription-Invoices.Links.Self'
                            }
                        },
                        title: 'Relationships.Subscription-Invoices.Links'
                    }
                },
                title: 'Relationships.Subscription-Invoices'
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
        const {
            storeId, customerId, orderId, productId, variantId, status, outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Subscriptions' });
        }

        // Build query parameters
        const params = {};
        if (storeId) {
            params['filter[store_id]'] = storeId;
        }
        if (customerId) {
            params['filter[customer_id]'] = customerId;
        }
        if (orderId) {
            params['filter[order_id]'] = orderId;
        }
        if (productId) {
            params['filter[product_id]'] = productId;
        }
        if (variantId) {
            params['filter[variant_id]'] = variantId;
        }
        if (status) {
            params['filter[status]'] = status;
        }

        // https://docs.lemonsqueezy.com/api/subscriptions
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.lemonsqueezy.com/v1/subscriptions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            params
        });

        const records = data.data || [];

        // Send to notFound port if no subscriptions are found
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
