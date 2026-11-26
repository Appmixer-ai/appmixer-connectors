'use strict';

const lib = require('../../lib');

// https://api.upsales.com/ - Appointment: GET /appointments
const PATH = '/appointments';
const QUERY = {};

module.exports = {

    async tick(context) {

        return lib.pollNewRecords(context, PATH, QUERY);
    },

    // Flow Test Mode: the newest matching record, read-only.
    async test(context) {

        const record = await lib.latestRecord(context, PATH, QUERY, 'id');
        if (!record) {
            throw new context.CancelError('No appointment records in Upsales to use as test data.');
        }
        return context.sendJson(record, 'out');
    }
};
