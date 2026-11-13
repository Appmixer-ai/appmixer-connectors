'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

// Inputs sent in the request body as they are.
const BODY_FIELDS = [
    'customer_id',
    'estimate_number',
    'reference_number',
    'currency_id',
    'exchange_rate',
    'discount',
    'discount_type',
    'is_discount_before_tax',
    'is_inclusive_tax',
    'salesperson_name',
    'template_id',
    'notes',
    'terms',
    'shipping_charge',
    'adjustment',
    'adjustment_description'
];

/**
 * Create an estimate in Zoho Books: POST /estimates.
 * @see https://www.zoho.com/books/api/v3/estimates/#create-an-estimate
 */
module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.customerId) {
            throw new context.CancelError('Customer ID is required!');
        }
        if (!input.lineItems) {
            throw new context.CancelError('Line Items is required!');
        }

        const data = lib.pickDefined(input, BODY_FIELDS);
        if (input.date) {
            data.date = lib.formatDate(input.date);
        }
        if (input.expiryDate) {
            data.expiry_date = lib.formatDate(input.expiryDate);
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
            ...lib.pickDefined(input, ['ignore_auto_number_generation', 'send'])
        };

        const zc = new ZohoClient(context);
        const response = await zc.request('POST', '/books/v3/estimates', { data, params });
        // The API reference documents the created record as an object; accept a one-item array too.
        const record = Array.isArray(response?.estimate) ? response.estimate[0] : response?.estimate;

        return context.sendJson(record || {}, 'out');
    }
};
