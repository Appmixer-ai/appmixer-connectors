'use strict';

const crypto = require('crypto');
const lib = require('../../lib');
const QueryStream = require('pg-query-stream');

module.exports = {

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context, context.messages.in.content.outputType);
        }

        const { query, outputType, asyncMode, _asyncJobId, _asyncError } = context.messages.in.content;

        // ─── ASYNC RESULT DELIVERY ─────────────────────────────────────────────
        // Called by jobs.js via triggerComponent when the long-running query finishes.
        if (_asyncJobId) {
            return this.deliverAsyncResult(context, _asyncJobId, outputType, _asyncError);
        }

        // ─── ASYNC MODE: START LONG-RUNNING QUERY ─────────────────────────────
        if (asyncMode) {
            return this.startAsyncQuery(context, query, outputType);
        }

        // ─── SYNC MODE: standard execution (unchanged) ────────────────────────
        await context.log({ step: 'query', query });

        if (outputType === 'file') {
            const savedFile = await lib.streamQueryToFile(context, 'result.csv', query);
            if (!savedFile.length) {
                await context.sendJson({ query, message: 'No data returned for the query.' }, 'emptyResult');
                return;
            }
            return context.sendJson({ fileId: savedFile.fileId }, 'out');
        }

        const queryStream = new QueryStream(query);
        const client = await lib.connect(context);
        const stream = client.query(queryStream);
        let hasData = false;
        let index = 0;
        const rows = [];

        try {
            await new Promise((resolve, reject) => {
                stream.on('data', async (row) => {
                    hasData = true;
                    if (outputType === 'row') {
                        await context.sendJson({ row, index: index++ }, 'out');
                    } else if (outputType === 'rows') {
                        rows.push(row);
                    } else {
                        reject(new Error('Unsupported outputType ' + outputType));
                    }
                });
                stream.on('error', reject);
                stream.on('end', resolve);
            });
        } finally {
            client.release();
        }

        if (!hasData) {
            return context.sendJson({ query, message: 'No data returned for the query.' }, 'emptyResult');
        }

        if (outputType === 'rows') {
            return context.sendJson({ rows }, 'out');
        }
    },

    /**
     * Starts an async (dblink-based) query.
     * Creates a Mongo job record, fires dblink_send_query, and returns immediately.
     * Results will be delivered later via deliverAsyncResult() triggered by jobs.js.
     */
    async startAsyncQuery(context, query, outputType) {

        const connections = require('../../connections');
        const AsyncJobModel = require('../../AsyncJobModel');
        const collection = context.db.collection(AsyncJobModel.collection);

        const jobId = crypto.randomBytes(16).toString('hex');

        await context.log({ step: 'async_query_start', jobId, query });

        // Create the job record in Mongo before firing the query
        await collection.insertOne({
            jobId,
            status: 'running',
            flowId: context.flowId,
            componentId: context.componentId,
            auth: context.auth,
            query,
            outputType,
            dblinkConnName: null,
            error: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        try {
            const dblinkConnName = await connections.startAsyncQuery(context.auth, jobId, query);

            // Store the active dblink connection name for observability
            await collection.updateOne(
                { jobId },
                { $set: { dblinkConnName, updatedAt: new Date() } }
            );

            await context.log({ step: 'async_query_started', jobId, dblinkConnName });

        } catch (err) {
            // Mark job as failed immediately
            await collection.updateOne(
                { jobId },
                { $set: { status: 'error', error: err.message, updatedAt: new Date() } }
            );
            throw err;
        }

        // Return without sending to output — jobs.js will deliver results asynchronously
    },

    /**
     * Called when jobs.js has determined the query is complete (or errored).
     * Fetches result rows from Mongo and sends them to the output port.
     */
    async deliverAsyncResult(context, jobId, outputType, asyncError) {

        const AsyncJobModel = require('../../AsyncJobModel');
        const collection = context.db.collection(AsyncJobModel.collection);

        if (asyncError) {
            throw new Error(`Async query failed: ${asyncError}`);
        }

        const job = await collection.findOne({ jobId });

        if (!job) {
            throw new Error(`[PG_ASYNC] Job ${jobId} not found in database.`);
        }

        if (job.status === 'error') {
            throw new Error(`Async query failed: ${job.error}`);
        }

        const rows = job.result || [];

        await context.log({ step: 'async_query_deliver', jobId, rowCount: rows.length });

        if (!rows.length) {
            return context.sendJson({ query: job.query, message: 'No data returned for the query.' }, 'emptyResult');
        }

        if (outputType === 'row') {
            for (let i = 0; i < rows.length; i++) {
                await context.sendJson({ row: rows[i], index: i }, 'out');
            }
        } else {
            // 'rows' — default for async (file output not supported in async mode)
            await context.sendJson({ rows }, 'out');
        }
    },

    async stop(context) {

        await lib.disconnect(context);
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'row') {
            return context.sendJson([{ label: 'Row', value: 'row' }, { label: 'Index', value: 'index' }], 'out');
        } else if (outputType === 'rows') {
            return context.sendJson([{ label: 'Rows', value: 'rows' }], 'out');
        } else {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};
