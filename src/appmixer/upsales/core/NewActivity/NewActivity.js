'use strict';

const lib = require('../../lib');

// https://api.upsales.com/ - Tasks: GET /activities
const PATH = '/activities';
const QUERY = {};

module.exports = {

    async tick(context) {

        return lib.pollNewRecords(context, PATH, QUERY);
    },

    // Flow Test Mode: the newest matching record, read-only.
    async test(context) {

        const record = await lib.latestRecord(context, PATH, QUERY, 'id');
        if (!record) {
            throw new context.CancelError('No task records in Upsales to use as test data.');
        }
        return context.sendJson(record, 'out');
    }
};
