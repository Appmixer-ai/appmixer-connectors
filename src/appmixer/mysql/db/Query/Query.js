'use strict';

const { stringify } = require('csv-stringify');
const { runQuery, createConnection } = require('../../common');

module.exports = {

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context, context.messages.in.content.outputType);
        }

        const { query, outputType } = context.messages.in.content;

        let conn;
        let hasData = false;

        try {
            conn = await createConnection(context);

            const queryStream = await runQuery(conn, query, []);

            if (outputType === 'file') {
                const stringifier = stringify({ header: true });
                const savedFile = await context.saveFileStream('result.csv', queryStream.pipe(stringifier));
                if (!savedFile.length) {
                    await context.sendJson({ query, messages: 'No data returned for the query.' }, 'emptyResult');
                }
                await context.sendJson({ fileId: savedFile.fileId }, 'out');
            } else {
                let index = 0;
                const rows = [];

                await new Promise((resolve, reject) => {
                    queryStream.on('data', async (row) => {
                        hasData = true;
                        if (outputType === 'row') {
                            await context.sendJson({ row, index: index++ }, 'out');
                        } else if (outputType === 'rows') {
                            rows.push(row);
                        } else {
                            throw new Error('Unsupported outputType ' + outputType);
                        }
                    });

                    queryStream.on('error', (err) => reject(err));

                    queryStream.on('end', async () => {
                        if (!hasData) {
                            await context.sendJson(
                                {
                                    query,
                                    messages: 'No data returned for the query.'
                                },
                                'emptyResult'
                            );
                        }
                        resolve();
                    });
                });

                if (outputType === 'rows') {
                    await context.sendJson({ rows }, 'out');
                }
            }
        } finally {
            if (conn) {
                conn.end();
            }
        }
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'row') {
            return context.sendJson([{ label: 'Row', value: 'row' }, { label: 'Index', value: 'index' }], 'out');
        } else if (outputType === 'rows') {
            return context.sendJson([{ label: 'Rows', value: 'rows' }], 'out');
        } else {
            // file
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};
