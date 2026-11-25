'use strict';

const lib = require('../lib');

// Fields every record carries; the module's standard fields are added in the output options.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: lib.COMMON_FIELDS
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { module: moduleName, recordId, fields } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return context.sendJson(lib.recordOutputOptions(moduleName), 'out');
        }

        lib.assertModule(context, moduleName);
        if (!recordId) {
            throw new context.CancelError('Record ID is required!');
        }

        const record = await lib.getRecord(context, moduleName, recordId, fields);
        return context.sendJson(record, 'out');
    }
};
