'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../../lib');

/**
 * Polls the Invoices module for invoices that have just become overdue. Each tick looks at the due
 * dates that elapsed between the previous run and yesterday, so an invoice is reported exactly
 * once. The first tick only records the watermark so that already overdue invoices are not
 * replayed into the flow.
 */
module.exports = {

    async tick(context) {

        const today = lib.startOfToday();
        const todayDate = lib.formatDate(today);
        const lastDate = await context.stateGet('lastDate');

        if (!lastDate) {
            return context.stateSet('lastDate', todayDate);
        }
        if (lastDate === todayDate) {
            return;
        }

        const { excludeStatus } = context.properties;
        const criteria = lib.buildCriteria([
            `(Due_Date:greater_equal:${lastDate})`,
            `(Due_Date:less_equal:${lib.formatDate(lib.addDays(today, -1))})`,
            excludeStatus ? `(Status:not_equal:${lib.escapeCriteriaValue(excludeStatus)})` : null
        ]);
        // v2 /search does not support comparators on date fields, hence the version override.
        const client = new ZohoClient(context, undefined, { apiVersion: lib.SEARCH_API_VERSION });
        const records = await client.search('Invoices', { criteria });

        for (const record of records) {
            await context.sendJson(record, 'out');
        }

        return context.stateSet('lastDate', todayDate);
    },

    async test(context) {

        const record = await (new ZohoClient(context)).getLatestRecord('Invoices');

        if (!record) {
            throw new context.CancelError('No invoices found to use as test data.');
        }

        return context.sendJson(record, 'out');
    }
};
