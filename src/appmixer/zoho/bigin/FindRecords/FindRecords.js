'use strict';

const lib = require('../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: lib.COMMON_FIELDS
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { module: moduleName, criteria, email, phone, word, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, lib.recordProperties(moduleName), {
                label: 'Records',
                value: 'result'
            });
        }

        lib.assertModule(context, moduleName);

        // The search API takes one of criteria, email, phone or word.
        let params;
        if (criteria) {
            params = { criteria };
        } else if (email) {
            params = { email };
        } else if (phone) {
            params = { phone };
        } else if (word) {
            params = { word };
        } else {
            throw new context.CancelError('Provide Criteria, Email, Phone or Word to search for.');
        }

        const records = await lib.getPaged(context, `/${moduleName}/search`, params);
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records });
    }
};
