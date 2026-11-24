'use strict';

const lib = require('../../lib');

// The fields every record has. The variable picker adds the fields of the chosen object
// (lib.recordProperties); it is built without the account, so custom fields are picked from
// Custom Fields, and each one is also a cf_* field of the record at run time.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'object'],
    properties: {
        id: { type: 'integer', title: 'Record ID', example: 4021 },
        object: { type: 'string', title: 'Object', example: 'ticket' },
        ownerId: { type: 'integer', title: 'Owner ID', example: 5 },
        ownerName: { type: 'string', title: 'Owner Name', example: 'Anna Berg' },
        createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
        updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-18T14:05:00Z' },
        customFields: {
            type: 'object',
            title: 'Custom Fields',
            example: { 'SuperOffice:1': 'Promoter', 'x_nps_score': 9 }
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { object, recordId } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            const properties = await lib.recordPropertiesFor(context, object);
            return context.sendJson(lib.toOutputOptions(properties), 'out');
        }

        if (!object) {
            throw new context.CancelError('Object is required!');
        }
        if (!recordId) {
            throw new context.CancelError('Record ID is required!');
        }

        const record = await lib.getRecord(context, object, recordId);
        return context.sendJson(record, 'out');
    }
};
