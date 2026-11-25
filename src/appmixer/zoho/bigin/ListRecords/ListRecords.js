'use strict';

const lib = require('../lib');

// Fields every record carries. Module specific fields are added per module in the output options.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: lib.COMMON_FIELDS
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { module: moduleName, fields, sortBy, sortOrder = 'desc', outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, lib.recordProperties(moduleName), {
                label: 'Records',
                value: 'result'
            });
        }

        if (!moduleName) {
            throw new context.CancelError('Module is required!');
        }
        lib.assertModule(context, moduleName);

        const params = { fields: await lib.fieldsParam(context, moduleName, fields) };
        if (sortBy) {
            // eslint-disable-next-line camelcase
            params.sort_by = sortBy;
            // eslint-disable-next-line camelcase
            params.sort_order = sortOrder;
        }
        const records = await lib.getPaged(context, `/${moduleName}`, params);
        return lib.sendArrayOutput({ context, outputType, records });
    }
};
