'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const filter = context.messages.in.content.filter;
        let where = '';
        const whereConditionsAnd = [];
        const whereValues = [];
        let paramIndex = 1;

        filter.AND.forEach(expressionAnd => {

            const whereConditionsOr = [];

            expressionAnd.OR.forEach(expressionOr => {

                const { column, operator, value } = expressionOr;
                const escapedColumn = lib.escapeIdentifier(column);
                let whereCondition = '';

                if (operator === 'CONTAINS') {
                    whereCondition += `${escapedColumn} LIKE $${paramIndex}`;
                    whereValues.push(`%${value}%`);
                    paramIndex++;
                } else if (operator === 'NOT CONTAINS') {
                    whereCondition += `${escapedColumn} NOT LIKE $${paramIndex}`;
                    whereValues.push(`%${value}%`);
                    paramIndex++;
                } else if (operator === 'STARTS WITH') {
                    whereCondition += `${escapedColumn} LIKE $${paramIndex}`;
                    whereValues.push(`${value}%`);
                    paramIndex++;
                } else if (operator === 'NOT STARTS WITH') {
                    whereCondition += `${escapedColumn} NOT LIKE $${paramIndex}`;
                    whereValues.push(`%${value}`);
                    paramIndex++;
                } else if (operator === 'ENDS WITH') {
                    whereCondition += `${escapedColumn} LIKE $${paramIndex}`;
                    whereValues.push(`%${value}`);
                    paramIndex++;
                } else if (operator === 'NOT ENDS WITH') {
                    whereCondition += `${escapedColumn} NOT LIKE $${paramIndex}`;
                    whereValues.push(`%${value}`);
                    paramIndex++;
                } else if (operator === 'IN') {
                    const inValues = value.trim().split(',').map(v => v.trim());
                    const placeholders = inValues.map((_, idx) => `$${paramIndex + idx}`).join(',');
                    whereCondition += `${escapedColumn} IN (${placeholders})`;
                    whereValues.push(...inValues);
                    paramIndex += inValues.length;
                } else if (operator === 'NOT IN') {
                    const inValues = value.trim().split(',').map(v => v.trim());
                    const placeholders = inValues.map((_, idx) => `$${paramIndex + idx}`).join(',');
                    whereCondition += `${escapedColumn} NOT IN (${placeholders})`;
                    whereValues.push(...inValues);
                    paramIndex += inValues.length;
                } else if (operator === 'IS NULL') {
                    whereCondition += `${escapedColumn} IS NULL`;
                } else if (operator === 'IS NOT NULL') {
                    whereCondition += `${escapedColumn} IS NOT NULL`;
                } else {
                    // LIKE, NOT LIKE, =, !=, <>, <, <=, >, >=
                    // and any operators passed as variables from the UI
                    const sanitizedOperator = lib.sanitizeOperator(operator, context);
                    whereCondition += `${escapedColumn} ${sanitizedOperator} $${paramIndex}`;
                    whereValues.push(value);
                    paramIndex++;
                }
                whereConditionsOr.push(whereCondition);
            });

            whereConditionsAnd.push('(' + whereConditionsOr.join(' OR ') + ')');
        });

        where = whereConditionsAnd.join(' AND ');

        let [schema, table] = context.properties.table.split('.');
        if (!table) {
            table = schema;
            schema = 'public';
        }

        const escapedSchema = lib.escapeIdentifier(schema);
        const escapedTable = lib.escapeIdentifier(table);
        let query = `DELETE FROM ${escapedSchema}.${escapedTable} WHERE ${where}`;
        await context.log({ step: 'query', query, values: whereValues });

        const res = await lib.query(context, query, whereValues);
        return context.sendJson({ rowCount: res.rowCount }, 'out');
    },

    async stop(context) {

        await lib.disconnect(context);
    }
};
