'use strict';

const lib = require('../../lib');

// https://api.upsales.com/ - Opportunity: GET /orders?probability=gte:1&probability=lte:99
const PATH = '/orders';
const QUERY = { probability: ['gte:1', 'lte:99'] };

module.exports = {

    async tick(context) {

        return lib.pollNewRecords(context, PATH, QUERY);
    },

    // Flow Test Mode: the newest matching record, read-only.
    async test(context) {

        const record = await lib.latestRecord(context, PATH, QUERY, 'id');
        if (!record) {
            throw new context.CancelError('No opportunity records in Upsales to use as test data.');
        }
        return context.sendJson(record, 'out');
    }
};
