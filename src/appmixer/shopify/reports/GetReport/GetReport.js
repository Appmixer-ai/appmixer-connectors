'use strict';
const commons = require('../../shopify-commons');

/**
 * Get a report.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const shopify = commons.getShopifyAPI(context.auth);
        const { id } = context.messages.in.content;


        if (!id) {
            throw new context.CancelError('ID is required!');
        }
        const report = await shopify.report.get(id);
        return context.sendJson(report, 'report');
    }
};
