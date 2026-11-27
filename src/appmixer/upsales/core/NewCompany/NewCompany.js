'use strict';

const lib = require('../../lib');

// https://api.upsales.com/ - Pagination: sort=id&id=gt:<last id>
const PATH = '/accounts';
const QUERY = { isExternal: 0 };

module.exports = {

    async tick(context) {

        return lib.pollNewRecords(context, PATH, QUERY);
    },

    // Flow Test Mode: the newest matching record, read-only.
    async test(context) {

        const record = await lib.latestRecord(context, PATH, QUERY, 'id');
        if (!record) {
            throw new context.CancelError('No company records in Upsales to use as test data.');
        }
        return context.sendJson(record, 'out');
    }
};
