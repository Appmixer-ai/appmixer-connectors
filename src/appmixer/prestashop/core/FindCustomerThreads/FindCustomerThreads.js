/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib');

// The output contract of one customer thread (see ITEM_SCHEMA in the connector guide).
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'status'],
    properties: {
        id: { type: 'string', title: 'Customer Thread ID', example: '7' },
        id_customer: { type: 'string', title: 'Customer ID', example: '2' },
        id_order: { type: 'string', title: 'Order ID', example: '5' },
        id_product: { type: 'string', title: 'Product ID', example: '0' },
        id_contact: { type: 'string', title: 'Contact ID', example: '2' },
        id_lang: { type: 'string', title: 'Language ID', example: '1' },
        id_shop: { type: 'string', title: 'Shop ID', example: '1' },
        email: { type: 'string', title: 'Email', example: 'pub@prestashop.com' },
        status: { type: 'string', title: 'Status', example: 'open' },
        token: { type: 'string', title: 'Token', example: 'a1b2c3d4e5f6' },
        date_add: { type: 'string', title: 'Created Date', example: '2024-02-20 08:15:00' },
        date_upd: { type: 'string', title: 'Updated Date', example: '2024-02-21 09:30:00' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { customerId, email, orderId, status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Customer Threads' });
        }

        const params = {
            display: 'full',
            sort: '[date_upd_DESC]',
            date: 1,
            limit: 100
        };
        if (customerId) params['filter[id_customer]'] = `[${customerId}]`;
        if (email) params['filter[email]'] = `[${email}]`;
        if (orderId) params['filter[id_order]'] = `[${orderId}]`;
        if (status) params['filter[status]'] = `[${status}]`;

        const data = await lib.psRequest(context, { path: '/customer_threads', params });

        const records = data.customer_threads || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
