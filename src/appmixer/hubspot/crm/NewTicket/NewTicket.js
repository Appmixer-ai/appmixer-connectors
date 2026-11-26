'use strict';
const NewObjectsPoller = require('../NewObjectsPoller');
const ITEM_SCHEMA = require('../../item-schemas.json').ticket;

const poller = new NewObjectsPoller({
    objectType: 'tickets',
    outPort: 'ticket',
    // Only tickets of the selected pipeline, when one is set.
    filters: ({ pipeline }) => (pipeline ? [{ propertyName: 'hs_pipeline', operator: 'EQ', value: pipeline }] : [])
});

module.exports = {

    ITEM_SCHEMA,

    async start(context) {

        return poller.start(context);
    },

    async tick(context) {

        return poller.tick(context);
    },

    async test(context) {

        const record = await poller.fetchExample(context);
        if (!record) {
            throw new context.CancelError('No record found to use as test data.');
        }
        return context.sendJson(record, 'ticket');
    }
};
