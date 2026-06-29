'use strict';

const { pollEntity, fetchLatestRecord } = require('../dynamics-commons');

const ENTITY = { logicalName: 'contact', entitySet: 'contacts', dateField: 'modifiedon' };

module.exports = {

    async tick(context) {

        return pollEntity(context, ENTITY);
    },

    async test(context) {

        // Flow Test Mode: no polling state, emit the most recently modified contact.
        const record = await fetchLatestRecord(context, ENTITY);
        if (!record) {
            throw new Error('No contacts found to use as test data.');
        }
        return context.sendJson(record, 'out');
    }
};
