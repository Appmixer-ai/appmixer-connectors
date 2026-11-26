'use strict';

const lib = require('../../lib');

// https://api.upsales.com/ - Contacts: GET /contacts, filtered on modDate
const PATH = '/contacts';
const QUERY = {};

module.exports = {

    async tick(context) {

        return lib.pollChangedRecords(context, PATH, QUERY);
    },

    // Flow Test Mode: the most recently modified matching record, read-only.
    async test(context) {

        const record = await lib.latestRecord(context, PATH, QUERY, 'modDate');
        if (!record) {
            throw new context.CancelError('No contact records in Upsales to use as test data.');
        }
        return context.sendJson(record, 'out');
    }
};
