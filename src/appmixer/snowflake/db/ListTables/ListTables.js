'use strict';
const { SnowflakeDB } = require('../../common');

module.exports = {

    async receive(context) {
        const { schema } = context.messages.in.content;
        if (!schema) {
            // Called as an inspector source before a schema is picked: no options instead of an error.
            if (context.properties.sendWholeArray) {
                return context.sendJson({ tables: [] }, 'tables');
            }
            throw new context.CancelError('Schema is required!');
        }
        const snowflake = new SnowflakeDB();
        const tables = await snowflake.listTables(context.auth, schema);
        return context.sendJson({ tables }, 'tables');
    },
    tablesToSelectArray({ tables }) {

        return tables.map(table => {
            return { label: table.name, value: table.name };
        });
    }
};
