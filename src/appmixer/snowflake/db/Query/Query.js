'use strict';
const { SnowflakeDB } = require('../../common');
const { stringify } = require('csv-stringify');

// The columns depend on the query, so a row is an open object.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['row', 'index'],
    properties: {
        row: { type: 'object', title: 'Row', example: { ID: 1, NAME: 'John Doe' } },
        index: { type: 'number', title: 'Index', example: 0 }
    }
};

/**
 * Values of the Parameters expression, in order. They are bound to the ? placeholders.
 * @param {{ ADD?: Array<{ value: * }> }} parameters
 * @returns {Array}
 */
function parameterValues(parameters) {

    const rows = parameters && Array.isArray(parameters.ADD) ? parameters.ADD : [];
    return rows.map(row => (row ? row.value : undefined));
}

module.exports = {

    ITEM_SCHEMA,

    parameterValues,

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context, context.messages.in.content.outputType);
        }
        const { query, outputType = 'file', parameters } = context.messages.in.content;
        if (!query || !query.trim()) {
            throw new context.CancelError('Query is required!');
        }
        if (!['row', 'rows', 'file'].includes(outputType)) {
            throw new context.CancelError('Unsupported output type: ' + outputType);
        }
        const statement = { sqlText: query, binds: parameterValues(parameters) };

        const snowflake = new SnowflakeDB();

        if (outputType === 'file') {
            const queryStream = await snowflake.getRows(context.auth, statement);
            const stringifier = stringify({ header: true });
            queryStream.on('error', err => stringifier.destroy(err));
            let savedFile;
            try {
                savedFile = await context.saveFileStream('result.csv', queryStream.pipe(stringifier));
            } catch (err) {
                // pipe() does not end the source when the destination fails; destroying it closes
                // the Snowflake connection.
                queryStream.destroy();
                throw err;
            }
            return context.sendJson({ fileId: savedFile.fileId }, 'out');
        }

        const rows = await snowflake.collectRows(context.auth, statement);
        if (outputType === 'rows') {
            return context.sendJson({ rows }, 'out');
        }
        let index = 0;
        for (const row of rows) {
            await context.sendJson({ row, index: index++ }, 'out');
        }
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'row') {
            return context.sendJson([
                { label: 'Row', value: 'row', schema: ITEM_SCHEMA.properties.row },
                { label: 'Index', value: 'index', schema: ITEM_SCHEMA.properties.index }
            ], 'out');
        } else if (outputType === 'rows') {
            return context.sendJson([{
                label: 'Rows',
                value: 'rows',
                schema: { type: 'array', items: ITEM_SCHEMA.properties.row, example: [ITEM_SCHEMA.properties.row.example] }
            }], 'out');
        } else {        // file
            return context.sendJson([
                { label: 'File ID', value: 'fileId', schema: { type: 'string', example: '5f1c3a2b9d8e7f6a5b4c3d2e' } }
            ], 'out');
        }
    }
};
