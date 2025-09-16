/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: {
        type: 'number',
        title: 'Customer Id'
    },
    address_count: {
        type: 'number',
        title: 'Address Count'
    },
    addresses: {
        type: 'array',
        items: {},
        title: 'Addresses'
    },
    attributes: {
        type: 'array',
        items: {},
        title: 'Attributes'
    },
    authentication: {
        type: 'object',
        properties: {
            force_password_reset: {
                type: 'boolean',
                title: 'Authentication.Force Password Reset'
            }
        },
        title: 'Authentication'
    },
    company: {
        type: 'string',
        title: 'Company'
    },
    customer_group_id: {
        type: 'number',
        title: 'Customer Group Id'
    },
    email: {
        type: 'string',
        title: 'Email'
    },
    first_name: {
        type: 'string',
        title: 'First Name'
    },
    last_name: {
        type: 'string',
        title: 'Last Name'
    },
    notes: {
        type: 'string',
        title: 'Notes'
    },
    phone: {
        type: 'string',
        title: 'Phone'
    },
    registration_ip_address: {
        type: 'string',
        title: 'Registration Ip Address'
    },
    tax_exempt_category: {
        type: 'string',
        title: 'Tax Exempt Category'
    },
    date_created: {
        type: 'string',
        title: 'Date Created'
    },
    date_modified: {
        type: 'string',
        title: 'Date Modified'
    },
    attribute_count: {
        type: 'number',
        title: 'Attribute Count'
    },
    form_fields: {
        type: 'array',
        items: {},
        title: 'Form Fields'
    },
    accepts_product_review_abandoned_cart_emails: {
        type: 'boolean',
        title: 'Accepts Product Review Abandoned Cart Emails'
    },
    store_credit_amounts: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                amount: {
                    type: 'number',
                    title: 'Store Credit Amounts.Amount'
                }
            }
        },
        title: 'Store Credit Amounts'
    },
    origin_channel_id: {
        type: 'number',
        title: 'Origin Channel Id'
    },
    channel_ids: {
        type: 'null',
        title: 'Channel Ids'
    },
    index: {
        type: 'number',
        title: 'Index'
    },
    count: {
        type: 'number',
        title: 'Count'
    }
};

module.exports = {

    async receive(context) {

        const {
            id_in,
            email_in,
            name_like,
            company_in,
            phone_in,
            date_created_start,
            date_created_end,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // Build query parameters according to BigCommerce API specification
        const params = {};

        // Hardcode limit to maximum allowed by BigCommerce API
        params.limit = 250;

        // Include all useful sub-resources for comprehensive customer data
        params.include = 'addresses,storecredit,attributes,formfields';

        if (id_in) {
            params['id:in'] = id_in;
        }

        if (email_in) {
            params['email:in'] = email_in;
        }

        if (name_like) {
            params['name:like'] = name_like;
        }

        if (company_in) {
            params['company:in'] = company_in;
        }

        if (phone_in) {
            params['phone:in'] = phone_in;
        }

        if (date_created_start) {
            params['date_created:min'] = date_created_start;
        }

        if (date_created_end) {
            params['date_created:max'] = date_created_end;
        }

        // https://developer.bigcommerce.com/api-reference/store-management/customers-v3/customers/getcustomers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/customers`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            params
        });

        const records = data.data || [];

        // If no customers found, send to notFound port
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
