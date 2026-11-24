'use strict';

const { SnowflakeDB, pairUpdates } = require('../../common');
const snowflake = new SnowflakeDB();
module.exports = {

    async start(context) {

        const { schema, table } = context.properties;
        await snowflake.createStream(context, schema, table);
    },

    async stop(context) {

        const { schema, table } = context.properties;
        await snowflake.dropStream(context, schema, table);
    },

    async tick(context) {

        const { schema, table } = context.properties;
        const data = await snowflake.consumeStream(context, schema, table, 'update');
        for (const { oldRow, updatedRow } of pairUpdates(data)) {
            await context.sendJson({ oldRow, updatedRow }, 'out');
        }
    },

    async test(context) {

        const { schema, table } = context.properties;
        // Read-only: fetch the newest actual row from the base table without
        // consuming/advancing the change stream. tick() emits { oldRow, updatedRow }
        // with the CDC metadata columns stripped, so the plain base-table row already
        // matches that shape for both sides.
        const sampleRow = await snowflake.getSampleRow(context.auth, schema, table);
        if (!sampleRow) {
            throw new Error('No rows in the table to use as test data.');
        }
        const oldRow = { ...sampleRow };
        delete oldRow.METADATA$ACTION;
        delete oldRow.METADATA$ISUPDATE;
        delete oldRow.METADATA$ROW_ID;

        const updatedRow = { ...sampleRow };
        delete updatedRow.METADATA$ACTION;
        delete updatedRow.METADATA$ISUPDATE;
        delete updatedRow.METADATA$ROW_ID;

        return context.sendJson({ oldRow, updatedRow }, 'out');
    }
};
