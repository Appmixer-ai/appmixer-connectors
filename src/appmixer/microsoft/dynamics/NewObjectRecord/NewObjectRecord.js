'use strict';

const { resolveGenericEntity, pollEntity, fetchLatestRecord } = require('../dynamics-commons');

const DATE_FIELD = 'createdon';

module.exports = {

    async tick(context) {

        return pollEntity(context, resolveGenericEntity(context, DATE_FIELD));
    },

    async test(context) {

        // Flow Test Mode: no polling state, emit the most recently created record of the selected entity.
        const entity = resolveGenericEntity(context, DATE_FIELD);
        const record = await fetchLatestRecord(context, entity);
        if (!record) {
            throw new Error(`No ${entity.logicalName} records found to use as test data.`);
        }
        return context.sendJson(record, 'out');
    }
};
