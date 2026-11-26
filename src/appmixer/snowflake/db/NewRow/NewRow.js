'use strict';

const { SnowflakeDB } = require('../../common');
const snowflake = new SnowflakeDB();

// The columns depend on the table, so the row is an open object. tick() emits the stream row,
// which also carries the METADATA$ACTION, METADATA$ISUPDATE and METADATA$ROW_ID columns.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['row'],
    properties: {
        row: {
            type: 'object',
            title: 'Row',
            example: { ID: 1, NAME: 'John Doe', 'METADATA$ACTION': 'INSERT', 'METADATA$ISUPDATE': false, 'METADATA$ROW_ID': '6c1f3b0e2a9d4f7e8b5c0d1e2f3a4b5c6d7e8f90' }
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async start(context) {

        const { schema, table } = context.properties;
        await snowflake.createStream(context, schema, table);
    },

    async stop(context) {

        const { schema, table } = context.properties;
        await snowflake.dropStream(context, schema, table);
    },

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context);
        }
    },

    async tick(context) {

        const { schema, table } = context.properties;
        const data = await snowflake.consumeStream(context, schema, table, 'insert');
        for (const row of data) {
            await context.sendJson({ row }, 'out');
        }
    },

    async test(context) {

        const { schema, table } = context.properties;
        // Read-only: fetch the newest actual row from the base table without
        // consuming/advancing the change stream. Reshape it to match what tick()
        // emits for an insert (a raw stream row carrying the CDC metadata columns).
        const sampleRow = await snowflake.getSampleRow(context.auth, schema, table);
        if (!sampleRow) {
            throw new Error('No rows in the table to use as test data.');
        }
        const row = {
            ...sampleRow,
            'METADATA$ACTION': 'INSERT',
            'METADATA$ISUPDATE': 'FALSE',
            'METADATA$ROW_ID': sampleRow['METADATA$ROW_ID'] || ''
        };
        return context.sendJson({ row }, 'out');
    },

    async getOutputPortOptions(context) {

        let subInspector = {};
        if (context.properties.schema && context.properties.table) {
            try {
                subInspector = await context.componentStaticCall('appmixer.snowflake.db.ListColumns', 'out', {
                    messages: {
                        in: {
                            schema: context.properties.schema,
                            table: context.properties.table
                        }
                    },
                    transform: './ListColumns#columnsToInspector'
                });
            } catch (err) {
                // The table may not exist yet (a flow can create it) or the account may be missing:
                // offer the whole row instead of failing the variable picker.
                subInspector = {};
            }
        }
        const options = [{
            label: 'Row',
            value: 'row'
        }];

        for (const key in subInspector.inputs) {
            options.push(
                {
                    label: `Row.${key}`,
                    value: `row.${key}`
                }
            );
        }
        return context.sendJson(options, 'out');
    }
};
