'use strict';
const commons = require('../../shopify-commons');

/**
 * Delete customer.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const shopify = commons.getShopifyAPI(context.auth);

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('ID is required!');
        }
        await shopify.customer.delete(id);
        return context.sendJson({ id }, 'deleted');
    }
};
