'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { module: moduleName, recordData } = context.messages.in.content;

        lib.assertModule(context, moduleName);
        if (!recordData) {
            throw new context.CancelError('Record Fields is required!');
        }
        const record = lib.parseRecordInput(context, recordData, 'Record Fields');

        const details = await lib.createRecord(context, moduleName, record);
        return context.sendJson(details, 'out');
    }
};
