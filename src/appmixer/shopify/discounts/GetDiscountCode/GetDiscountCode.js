'use strict';
const commons = require('../../lib');

/**
 * Get an existing discount code together with the terms of its price rule.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { code } = context.messages.in.content;

        if (!code) {
            throw new context.CancelError('Discount Code is required!');
        }

        const shopify = commons.getShopifyAPI(context);
        const trimmedCode = String(code).trim();
        // The discount comes back with its terms (value, validity, usage limit)
        // embedded as `price_rule`.
        const discountCode = await shopify.discount.lookupCode(trimmedCode);

        if (!discountCode) {
            throw new context.CancelError(`Discount code ${trimmedCode} was not found.`);
        }

        return context.sendJson(discountCode, 'out');
    }
};
