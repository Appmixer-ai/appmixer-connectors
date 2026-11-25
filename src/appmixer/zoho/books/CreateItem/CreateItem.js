'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

// Inputs sent in the request body as they are.
const BODY_FIELDS = [
    'name',
    'rate',
    'description',
    'sku',
    'product_type',
    'item_type',
    'tax_id',
    'account_id',
    'purchase_rate',
    'purchase_description',
    'purchase_account_id',
    'inventory_account_id',
    'vendor_id'
];

/**
 * Create an item in Zoho Books: POST /items.
 * @see https://www.zoho.com/books/api/v3/items/#create-an-item
 */
module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.name) {
            throw new context.CancelError('Name is required!');
        }
        if (input.rate === undefined || input.rate === null || input.rate === '') {
            throw new context.CancelError('Rate is required!');
        }

        const data = lib.pickDefined(input, BODY_FIELDS);

        const params = { organization_id: input.organizationId };

        const zc = new ZohoClient(context);
        const response = await zc.request('POST', '/books/v3/items', { data, params });
        // The API reference documents the created record as an object; accept a one-item array too.
        const record = Array.isArray(response?.item) ? response.item[0] : response?.item;

        return context.sendJson(record || {}, 'out');
    }
};
