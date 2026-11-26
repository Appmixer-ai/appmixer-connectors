'use strict';
const commons = require('../lib');

const OUTPUT_PORT = 'out';

// The fields every emitted record has. The variable picker adds the fields of the chosen
// object (GetObjectFields); oldValue is set by the Changes / Changes to conditions only.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['Id'],
    properties: {
        Id: { type: 'string', title: 'Record ID', example: '5003000000D8cuIAAR' },
        SystemModstamp: { type: 'string', title: 'System Modstamp', example: '2026-11-23T17:43:12.000Z' },
        oldValue: { type: 'string', title: 'Old Value', example: 'Working' },
        newValue: { type: 'string', title: 'New Value', example: 'Closed' }
    }
};

/**
 * Generic trigger: a record of any standard or custom object is updated and the watched
 * field changes, changes to a value, or (does not) equal a value. Polls with a watermark
 * (SystemModstamp or the Field History CreatedDate), pages through every change and keeps
 * no snapshot of the object in the state.
 * @extends {Component}
 */
module.exports = {

    ITEM_SCHEMA,

    async start(context) {

        return commons.startRecordUpdated(context);
    },

    async tick(context) {

        return commons.tickRecordUpdated(context, OUTPUT_PORT);
    },

    async test(context) {

        // Flow Test Mode: the latest change that meets the condition, read-only, no state written.
        const item = await commons.findRecordUpdatedExample(context);
        if (!item) {
            const { objectName } = context.properties;
            throw new context.CancelError(
                `No recent ${objectName} change meets the condition to use as test data. Make such a change in Salesforce and test again.`
            );
        }
        return context.sendJson(item, OUTPUT_PORT);
    }
};
