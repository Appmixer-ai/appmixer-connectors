'use strict';
const { SnowflakeDB } = require('../../common');

// The columns depend on the table, so the row is an open object with the inserted values.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['row'],
    properties: {
        row: { type: 'object', title: 'Row', example: { ID: '1', NAME: 'John Doe' } }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context);
        }

        if (context.properties.generateInspector) {

            let subInspector = {};
            if (context.properties.schema && context.properties.table) {
                subInspector = await context.componentStaticCall('appmixer.snowflake.db.ListColumns', 'out', {
                    messages: {
                        in: {
                            schema: context.properties.schema,
                            table: context.properties.table
                        }
                    },
                    transform: './ListColumns#columnsToInspector'
                });
            }

            const inspector = {
                schema: {
                    properties: {
                        schema: {
                            type: 'string'
                        },
                        table: {
                            type: 'string'
                        }
                    },
                    required: ['schema', 'table']
                },
                inputs: {
                    schema: {
                        type: 'text',
                        label: 'Schema',
                        index: 1,
                        source: {
                            url: '/component/appmixer/snowflake/db/ListSchemas?outPort=schemas',
                            data: {
                                properties: {
                                    sendWholeArray: true
                                },
                                transform: './ListSchemas#schemasToSelectArray'
                            }
                        },
                        tooltip: 'The schema of the table. Pick one or type its name.'
                    },
                    table: {
                        type: 'text',
                        index: 2,
                        label: 'Table',
                        source: {
                            url: '/component/appmixer/snowflake/db/ListTables?outPort=tables',
                            data: {
                                properties: {
                                    sendWholeArray: true
                                },
                                messages: {
                                    'in/schema': 'inputs/in/schema'
                                },
                                transform: './ListTables#tablesToSelectArray'
                            }
                        },
                        tooltip: 'The table to insert the row into. Pick one or type its name; the inspector then shows a field per column.'
                    }
                }
            };

            return context.sendJson({
                schema: Object.assign(subInspector?.schema || {}, inspector.schema),
                inputs: Object.assign(subInspector?.inputs || {}, inspector.inputs),
                groups: subInspector?.groups || {}
            }, 'out');
        }

        const { schema, table, ...columnValues } = context.messages.in.content;
        if (!schema) {
            throw new context.CancelError('Schema is required!');
        }
        if (!table) {
            throw new context.CancelError('Table is required!');
        }
        if (!Object.keys(columnValues).length) {
            throw new context.CancelError('Fill in at least one column.');
        }

        const snowflake = new SnowflakeDB();
        await snowflake.addRow(context.auth, schema, table, Object.keys(columnValues), Object.values(columnValues));
        return context.sendJson({ row: columnValues }, 'out');
    },

    async getOutputPortOptions(context) {

        let subInspector = {};
        const { schema, table } = context.messages.in.content;

        if (schema && table) {
            try {
                subInspector = await context.componentStaticCall('appmixer.snowflake.db.ListColumns', 'out', {
                    messages: {
                        in: {
                            schema,
                            table
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
