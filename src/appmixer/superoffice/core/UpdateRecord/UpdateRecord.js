'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (context.properties.generateInspector) {
            // The object may be a variable ({{{...}}}) while the flow is designed: then only the
            // inputs common to every object are offered.
            const { object } = context.properties;
            const known = typeof object === 'string' && lib.RECORD_OBJECTS[object] ? object : undefined;
            return context.sendJson(await lib.updateRecordInspector(context, known), 'out');
        }

        const input = context.messages.in.content;
        const { object, recordId } = input;

        if (!object) {
            throw new context.CancelError('Object is required!');
        }
        if (!recordId) {
            throw new context.CancelError('Record ID is required!');
        }

        await lib.updateRecord(context, object, recordId, input);
        return context.sendJson({}, 'out');
    }
};
