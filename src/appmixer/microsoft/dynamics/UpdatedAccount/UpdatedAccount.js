'use strict';

const { pollEntity, fetchLatestRecord } = require('../dynamics-commons');

const ENTITY = { logicalName: 'account', entitySet: 'accounts', dateField: 'modifiedon' };

module.exports = {

    async tick(context) {

        return pollEntity(context, ENTITY);
    },

    async test(context) {

        // Flow Test Mode: no polling state, emit the most recently modified account.
        const record = await fetchLatestRecord(context, ENTITY);
        if (!record) {
            throw new Error('No accounts found to use as test data.');
        }
        return context.sendJson(record, 'out');
    }
};
