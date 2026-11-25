'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

// Inputs sent in the request body as they are.
const BODY_FIELDS = [
    'customer_id',
    'salesorder_number',
    'reference_number',
    'currency_id',
    'exchange_rate',
    'discount',
    'discount_type',
    'is_discount_before_tax',
    'is_inclusive_tax',
    'delivery_method',
    'salesperson_name',
    'estimate_id',
    'notes',
    'terms',
    'shipping_charge',
    'adjustment',
    'adjustment_description'
];

/**
 * Create a sales order in Zoho Books: POST /salesorders.
 * @see https://www.zoho.com/books/api/v3/sales-order/#create-a-sales-order
 */
module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.customerId) {
            throw new context.CancelError('Customer ID is required!');
        }

        const data = lib.pickDefined(input, BODY_FIELDS);
        if (input.date) {
            data.date = lib.formatDate(input.date);
        }
        if (input.shipmentDate) {
            data.shipment_date = lib.formatDate(input.shipmentDate);
        }
        const lineItems = lib.parseJsonInput(context, input.lineItems, 'Line Items');
        if (lineItems !== undefined) {
            data.line_items = lineItems;
        }
        const customFields = lib.parseJsonInput(context, input.customFields, 'Custom Fields');
        if (customFields !== undefined) {
            data.custom_fields = customFields;
        }

        // Query parameters, not body fields.
        const params = {
            organization_id: input.organizationId,
            ...lib.pickDefined(input, ['ignore_auto_number_generation'])
        };

        const zc = new ZohoClient(context);
        const response = await zc.request('POST', '/books/v3/salesorders', { data, params });
        // The API reference documents the created record as an object; accept a one-item array too.
        const record = Array.isArray(response?.salesorder) ? response.salesorder[0] : response?.salesorder;

        return context.sendJson(record || {}, 'out');
    }
};
