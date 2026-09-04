'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

/**
 * Polls the Invoices module for invoices reaching their due date. The target due date moves once a
 * day, and the last emitted target date is kept in state so each due date is reported only once.
 */
module.exports = {

    async tick(context) {

        const daysBefore = Number(context.properties.daysBefore) || 0;
        const targetDate = lib.formatDate(lib.addDays(lib.startOfToday(), daysBefore));
        const lastDate = await context.stateGet('lastDate');

        if (lastDate === targetDate) {
            return;
        }

        // v2 /search does not support comparators on date fields, hence the version override.
        const client = new ZohoClient(context, undefined, { apiVersion: lib.SEARCH_API_VERSION });
        const records = await client.search('Invoices', { criteria: `(Due_Date:equals:${targetDate})` });

        for (const record of records) {
            await context.sendJson(record, 'out');
        }

        return context.stateSet('lastDate', targetDate);
    },

    async test(context) {

        const record = await (new ZohoClient(context)).getLatestRecord('Invoices');

        if (!record) {
            throw new context.CancelError('No invoices found to use as test data.');
        }

        return context.sendJson(record, 'out');
    }
};
