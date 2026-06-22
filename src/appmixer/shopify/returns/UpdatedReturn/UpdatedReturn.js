'use strict';
const commons = require('../../shopify-commons');

/**
 * Component which triggers whenever a return is updated, e.g. when its status
 * changes after a return journey has begun.
 * @extends {Component}
 */
module.exports = {

    async start(context) {

        return commons.registerWebhook(context, 'returns/update');
    },

    async receive(context) {

        if (context.messages.webhook) {
            return commons.onReceive(context, 'return');
        }
    },

    async stop(context) {

        return commons.unregisterWebhook(context);
    },

    async test(context) {

        const returnRecord = await commons.fetchLatestExample(context, 'return');
        if (!returnRecord) {
            throw new Error('No recent returns to use as test data.');
        }

        return context.sendJson(returnRecord, 'return');
    }
};
