'use strict';
const pathModule = require('path');

const XeroClient = require('./XeroClient');

module.exports = {

    // Expects standardized outputType: 'item', 'items', 'file'
    async sendArrayOutput({ context, outputPortName = 'out', outputType = 'items', records = [] }) {
        if (outputType === 'item') {
            // One by one.
            await context.sendArray(records, outputPortName);
        } else if (outputType === 'items') {
            // All at once.
            await context.sendJson({ items: records }, outputPortName);
        } else if (outputType === 'file') {
            // Into CSV file.
            const headers = Object.keys(records[0] || {});
            let csvRows = [];
            csvRows.push(headers.join(','));
            for (const record of records) {
                const values = headers.map(header => {
                    const val = record[header];
                    return `"${val}"`;
                });
                // To add ',' separator between each value
                csvRows.push(values.join(','));
            }
            const csvString = csvRows.join('\n');
            let buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || 'xero-export'}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    /**
     * Handles a webhook message from Xero plugin for contacts and invoices.
     * @param {string} endpoint The Xero endpoint to fetch data from. E.g. '/api.xro/2.0/Contacts'.
     * @returns {Promise<void>}
     */
    async webhookHandler(context, endpoint) {

        const { tenantId } = context.properties;
        await context.log({ step: 'Received webhook', tenantId, webhook: context.messages.webhook });

        let lock;
        try {
            lock = await context.lock(context.componentId, { maxRetryCount: 0 });

            const xc = new XeroClient(context, tenantId);
            const IDs = context.messages.webhook.content.data;
            // There might be hundreds of IDs in one webhook, so we need to fetch them in chunks of 40.
            // The limit here is the URL length, which is 2048 characters. This is a safe limit of 1440 characters.
            const chunkSize = 40;
            const chunks = [];
            for (let i = 0; i < IDs.length; i += chunkSize) {
                chunks.push(IDs.slice(i, i + chunkSize));
            }
            for (const chunk of chunks) {
                const chunkRecords = await xc.requestPaginated('GET', endpoint, { params: { IDs: chunk.join(','), includeArchived: true, summaryOnly: false } });

                // Send the data out. Await it so that we don't get ContextNotFoundError.
                await context.sendArray(chunkRecords, 'out');
            }
        } finally {
            if (lock) {
                await lock.unlock();
            }
        }
    },

    /**
     * Fetches the most recently updated record from a Xero endpoint to use as a
     * Flow Test Mode example. Goes through the SAME XeroClient as webhookHandler()
     * (same auth, endpoint, dataKey and includeArchived/summaryOnly flags) so the
     * emitted object is byte-for-byte identical to a real webhook delivery — only
     * the selection differs (newest-first instead of the webhook's IDs).
     * @param {string} endpoint The Xero endpoint, e.g. '/api.xro/2.0/Contacts'.
     * @returns {Promise<object>} The newest record.
     */
    async fetchLatestExample(context, endpoint) {

        const { tenantId } = context.properties;
        if (!tenantId) {
            throw new context.CancelError('Tenant is required to fetch a test example.');
        }

        const xc = new XeroClient(context, tenantId);
        const records = await xc.requestPaginated('GET', endpoint, {
            countLimit: 1,
            params: { order: 'UpdatedDateUTC DESC', includeArchived: true, summaryOnly: false }
        });

        if (!records.length) {
            throw new context.CancelError(`No records found at ${endpoint} to use as test data.`);
        }

        return records[0];
    }
};
