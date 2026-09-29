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
        const discountCode = await shopify.discountCode.lookup(trimmedCode);

        if (!discountCode) {
            throw new context.CancelError(`Discount code ${trimmedCode} was not found.`);
        }

        // The code alone carries no terms (value, validity, usage limit) — those
        // live on the price rule it belongs to, so return both.
        const priceRule = await shopify.priceRule.get(discountCode['price_rule_id']);

        return context.sendJson({ ...discountCode, 'price_rule': priceRule }, 'out');
    }
};
