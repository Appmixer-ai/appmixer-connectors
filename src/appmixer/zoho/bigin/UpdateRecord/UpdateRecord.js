'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { module: moduleName, recordId, recordData } = context.messages.in.content;

        lib.assertModule(context, moduleName);
        if (!recordId) {
            throw new context.CancelError('Record ID is required!');
        }
        if (!recordData) {
            throw new context.CancelError('Record Fields is required!');
        }
        const record = lib.parseRecordInput(context, recordData, 'Record Fields');

        const body = await lib.request(context, {
            method: 'PUT',
            path: `/${moduleName}/${encodeURIComponent(recordId)}`,
            data: { data: [{ ...record, id: String(recordId) }] }
        });
        lib.recordResult(body);
        return context.sendJson({}, 'out');
    }
};
