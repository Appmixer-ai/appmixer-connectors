'use strict';

const lib = require('../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: lib.recordProperties('Contacts')
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { email, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Contacts',
                value: 'result'
            });
        }

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const records = await lib.getPaged(context, '/Contacts/search', { email });
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records });
    }
};
