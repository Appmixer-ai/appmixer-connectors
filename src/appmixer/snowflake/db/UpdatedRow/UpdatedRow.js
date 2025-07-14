'use strict';

const { SnowflakeDB } = require('../../common');
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
        const mid = data.length / 2;
        for (let i = 0; i < mid; i++) {

            const oldRow = { ...data[i + mid] };
            delete oldRow.METADATA$ACTION;
            delete oldRow.METADATA$ISUPDATE;
            delete oldRow.METADATA$ROW_ID;

            const updatedRow = { ...data[i] };
            delete updatedRow.METADATA$ACTION;
            delete updatedRow.METADATA$ISUPDATE;
            delete updatedRow.METADATA$ROW_ID;

            await context.sendJson({ oldRow, updatedRow }, 'out');
        }
    }
};
