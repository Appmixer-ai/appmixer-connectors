/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: { type: 'number', title: 'Order Id' },
    customer_id: { type: 'number', title: 'Customer Id' },
    date_created: { type: 'string', title: 'Date Created' },
    status: { type: 'string', title: 'Status' },
    total_inc_tax: { type: 'string', title: 'Total Inc Tax' },
    payment_method: { type: 'string', title: 'Payment Method' },
    payment_status: { type: 'string', title: 'Payment Status' },
    refunded_amount: { type: 'string', title: 'Refunded Amount' },
    billing_address: {
        type: 'object',
        properties: {
            first_name: { type: 'string', title: 'Billing Address.First Name' },
            last_name: { type: 'string', title: 'Billing Address.Last Name' },
            email: { type: 'string', title: 'Billing Address.Email' },
            phone: { type: 'string', title: 'Billing Address.Phone' },
            country: { type: 'string', title: 'Billing Address.Country' }
        },
        title: 'Billing Address'
    },
    shipping_addresses: {
        type: 'object',
        properties: {
            url: { type: 'string', title: 'Shipping Addresses.Url' }
        },
        title: 'Shipping Addresses'
    },
    products: {
        type: 'object',
        properties: {
            url: { type: 'string', title: 'Products.Url' }
        },
        title: 'Products'
    },
    currency_code: { type: 'string', title: 'Currency Code' },
    discount_amount: { type: 'string', title: 'Discount Amount' },
    external_order_id: { type: 'string', title: 'External Order Id' }
};


module.exports = {

    async receive(context) {

        const {
            email,
            customer_id,
            status_id,
            payment_method,
            min_total,
            max_total,
            min_date_created,
            max_date_created,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // Build parameters object with all available filters
        const params = {};

        // Apply all documented filter parameters
        if (email) params.email = email;
        if (customer_id) params.customer_id = customer_id;
        if (status_id) params.status_id = status_id;
        if (payment_method) params.payment_method = payment_method;
        if (min_total) params.min_total = min_total;
        if (max_total) params.max_total = max_total;
        if (min_date_created) params.min_date_created = min_date_created;
        if (max_date_created) params.max_date_created = max_date_created;

        // Hardcode optimal performance values
        params.limit = 250; // BigCommerce maximum limit for better performance
        params.include = 'consignments,consignments.line_items,fees'; // Include all useful sub-resources

        // https://developer.bigcommerce.com/api-reference/store-management/orders/orders/getorders
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v2/orders`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            params
        });

        // BigCommerce API returns orders array directly or in data property
        const records = Array.isArray(data) ? data :
            (data && Array.isArray(data.data)) ? data.data :
                [];

        // Handle empty results - send to notFound port
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
