'use strict';
const commons = require('../../shopify-commons');

/**
 * Get a product.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const shopify = commons.getShopifyAPI(context.auth);
        const { id } = context.messages.in.content;


        if (!id) {
            throw new context.CancelError('ID is required!');
        }
        const product = await shopify.product.get(id);
        return context.sendJson(product, 'product');
    }
};
