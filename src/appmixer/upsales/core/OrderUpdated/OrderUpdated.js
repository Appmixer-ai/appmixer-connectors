'use strict';

const lib = require('../../lib');

// https://api.upsales.com/ - Opportunity / Order: GET /orders, filtered on modDate
const PATH = '/orders';
const QUERY = {};

module.exports = {

    async tick(context) {

        return lib.pollChangedRecords(context, PATH, QUERY, { track: true });
    },

    // Flow Test Mode: the most recently modified matching record, read-only.
    async test(context) {

        const record = await lib.latestRecord(context, PATH, QUERY, 'modDate');
        if (!record) {
            throw new context.CancelError('No order records in Upsales to use as test data.');
        }
        return context.sendJson(lib.withChangeInfo(record), 'out');
    }
};
