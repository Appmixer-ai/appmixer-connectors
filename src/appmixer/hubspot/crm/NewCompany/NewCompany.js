'use strict';
const NewObjectsPoller = require('../NewObjectsPoller');
const ITEM_SCHEMA = require('../../item-schemas.json').company;

const poller = new NewObjectsPoller({
    objectType: 'companies',
    outPort: 'company'
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
        return context.sendJson(record, 'company');
    }
};
