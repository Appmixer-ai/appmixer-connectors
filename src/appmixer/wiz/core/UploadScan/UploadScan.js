const lib = require('../../lib');
const uuid = require('uuid').v4;
const moment = require('moment');

const getLockConfiguration = (context) => {

    return {
        retryDelay: parseInt(context.config.uploadLockRetryDelay, 10) || 3000,
        ttl: parseInt(context.config.uploadLockTtl, 10) || 15 * 60 * 1000,
        maxRetryCount: parseInt(context.config.uploadLockMaxRetryCount, 10) || 60
    };
};

module.exports = {

    start(context) {

        context.log({
            step: 'start', lockConfiguration: getLockConfiguration(context)
        });

        const { scheduleValue } = context.properties;
        if (scheduleValue) {
            return this.scheduleDrain(context);
        }
    },

    // docs: https://win.wiz.io/reference/pull-cloud-resources
    async receive(context) {

        const { threshold, scheduleValue } = context.properties;

        if (context.messages.timeout) {
            await this.scheduleDrain(context);
            const entries = await context.stateGet('documents') || [];
            if (entries.length > 0) {
                await this.processAllDocuments(context, { threshold });
            }
        } else {
            const { document, filename, integrationId } = context.messages.in.content;

            if (!await context.stateGet('metadata')) {
                await context.stateSet('metadata', { filename, integrationId });
            }

            await context.stateAddToSet('documents', { id: uuid(), data: document });
            const entries = await context.stateGet('documents') || [];

            context.log({ step: 'receive', entries: entries.length });

            if (!scheduleValue || (threshold && entries.length >= threshold)) {
                await this.processAllDocuments(context, { threshold });
            }
        }
    },

    async processAllDocuments(context, { threshold } = {}) {
        const documents = await this.prepareForSend(context, { threshold });
        await this.processSend(context, { documents });
        const entries = await context.stateGet('documents') || [];
        if (threshold && entries.length >= threshold) {
            await this.processAllDocuments(context, { threshold });
        }
    },

    async prepareForSend(context, { threshold }) {

        const entriesToUpload = await context.stateGet('documents-upload-batch');
        if (entriesToUpload) {
            await context.log({
                step: 'pre-upload: skipping, upload already in progress',
                message: `Found ${entriesToUpload.length} documents in documents-upload-batch.`
            });
            return [];
        }

        if (threshold && (await context.stateGet('documents') || []).length < threshold) {
            await context.log({ step: 'pre-upload: skipping, not enough documents' });
            return [];
        }

        let prepareDocumentsLock;
        try {

            // https://docs.appmixer.com/6.0/v4.1/component-definition/behaviour#async-context.lock-lockname-options
            prepareDocumentsLock = await context.lock(context.componentId, getLockConfiguration(context));

            const entriesToUpload = await context.stateGet('documents-upload-batch');
            let documents = [];

            if (entriesToUpload) {
                documents = entriesToUpload.map(entry => entry.data);
                await context.log({
                    step: 'documents-upload-batch docs',
                    message: `Prepared ${documents.length} documents for upload.`,
                    lock: prepareDocumentsLock
                });

            } else {
                let entries = (await context.stateGet('documents') || []);

                if (threshold && entries.length > threshold) {
                    await context.stateSet('documents', entries.slice(0, -threshold)); // keep all but the last `threshold` entries
                    await context.stateSet('documents-upload-batch', entries.slice(-threshold)); // take the last `threshold` entries
                    entries = entries.slice(-threshold);
                } else {
                    await context.stateSet('documents-upload-batch', entries);
                    await context.stateUnset('documents');
                }
                await context.log({
                    step: 'prepareForSend',
                    entries: entries.length,
                    threshold,
                    message: `Prepared ${entries.length} documents for upload.`
                });
                documents = entries.map(entry => entry.data);
            }

            return documents;
        } finally {
            prepareDocumentsLock?.unlock();
        }
    },

    async processSend(context, { documents }) {

        if (!documents || documents.length === 0) {
            return;
        }

        let lock;

        try {

            const { integrationId, filename } = await context.stateGet('metadata') || {};
            if (!integrationId || !filename) {
                throw new context.CancelError('No metadata found in state. Cannot send documents.');
            }

            lock = await context.lock('upload_lock_' + context.componentId, getLockConfiguration(context));
            await this.sendDocuments(context, {
                documents,
                filename,
                integrationId
            });
            await context.stateUnset('documents-upload-batch');

        } finally {
            lock?.unlock();
        }
    },

    async scheduleDrain(context) {

        const { scheduleValue, scheduleType } = context.properties;
        const now = moment();
        const referenceDate = moment();

        if (!['minutes', 'hours', 'days'].includes(scheduleType)) {
            throw new context.CancelError(`Invalid scheduleType: ${scheduleType}`);
        }

        const nextDate = referenceDate.add(scheduleValue, scheduleType);
        await context.log({ step: 'schedule', nextDate: nextDate.toISOString() });
        const diff = nextDate.diff(now);
        if (diff <= 0) {
            throw new context.CancelError(`Computed timeout is non‑positive (${diff} ms). Check schedule parameters.`);
        }

        await context.setTimeout({}, diff);
    },

    async sendDocuments(context, { documents, filename, integrationId }) {

        const { url, systemActivityId } = await lib.requestUpload(context, { filename });

        const fileContent = {
            integrationId,
            dataSources: documents
        };

        await lib.uploadFile(context, { url, fileContent });
        const systemActivity = await lib.getStatus(context, systemActivityId);

        // throw error if the system activity is not valid.
        lib.validateUploadStatus(context, { systemActivity });

        return context.sendJson(systemActivity, 'out');
    }
};

