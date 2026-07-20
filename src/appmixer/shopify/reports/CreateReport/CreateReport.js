'use strict';
const commons = require('../../lib');

/**
 * Create report.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const shopify = commons.getShopifyAPI(context);

        const reportInfo = context.messages.in.content;

        if (!reportInfo.name) {
            throw new context.CancelError('Name is required!');
        }
        if (!reportInfo.shopify_ql) {
            throw new context.CancelError('ShopifyQL query is required!');
        }
        const report = await shopify.report.create(reportInfo);
        return context.sendJson(report, 'report');
    }
};
