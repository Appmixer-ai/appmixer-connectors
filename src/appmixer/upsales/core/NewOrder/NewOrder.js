'use strict';

const lib = require('../../lib');

// https://api.upsales.com/ - Order: GET /orders?probability=100, filtered on modDate
const PATH = '/orders';
const QUERY = { probability: 100 };

module.exports = {

    async tick(context) {

        return lib.pollChangedRecords(context, PATH, QUERY, { onceById: true });
    },

    // Flow Test Mode: the most recently modified matching record, read-only.
    async test(context) {

        const record = await lib.latestRecord(context, PATH, QUERY, 'modDate');
        if (!record) {
            throw new context.CancelError('No order records in Upsales to use as test data.');
        }
        return context.sendJson(record, 'out');
    }
};
