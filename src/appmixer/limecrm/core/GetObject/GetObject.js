'use strict';

const lib = require('../../lib');

// The output contract of one object when the limetype's properties are not known; the
// variables are generated from the limetype by GetObjectSchema.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'ID', example: 1001 },
        _createdtime: { type: 'string', format: 'date-time', title: 'Created Time', example: '2026-11-16T09:30:00+01:00' },
        _timestamp: { type: 'string', format: 'date-time', title: 'Updated Time', example: '2026-11-16T10:15:00+01:00' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');
        if (!context.messages.in.content.objectId) {
            throw new context.CancelError('Object ID is required!');
        }
        const objectId = lib.assertId(context, context.messages.in.content.objectId, 'Object ID');
        const object = await lib.getObject(context, limetype, objectId);
        return context.sendJson(object, 'out');
    }
};
