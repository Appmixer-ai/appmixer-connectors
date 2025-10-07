'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const row = context.messages.row.content;
        const columns = Object.keys(row);
        const values = Object.values(row);
        const escapedColumns = columns.map(col => lib.escapeIdentifier(col));
        const valuesMarkers = columns.map((col, index) => '$' + (index + 1));

        let [schema, table] = context.properties.table.split('.');
        if (!table) {
            table = schema;
            schema = 'public';
        }

        const escapedSchema = lib.escapeIdentifier(schema);
        const escapedTable = lib.escapeIdentifier(table);
        let query = `INSERT INTO ${escapedSchema}.${escapedTable}(${escapedColumns.join(',')}) VALUES(${valuesMarkers.join(',')}) RETURNING *`;
        await context.log({ step: 'query', query, values });

        const res = await lib.query(context, query, values);
        return context.sendJson(res.rows[0], 'newRow');
    },

    async stop(context) {

        await lib.disconnect(context);
    }
};


