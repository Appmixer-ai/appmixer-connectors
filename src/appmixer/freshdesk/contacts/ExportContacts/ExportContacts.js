'use strict';

const axios = require('axios');

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Parse a comma-separated string into a trimmed array, filtering empty values.
 */
function parseList(str) {

    if (!str) return undefined;
    const items = str.split(',').map(s => s.trim()).filter(Boolean);
    return items.length ? items : undefined;
}

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { defaultFields, customFields } = context.messages.in.content;

        const fields = {};
        const parsedDefault = parseList(defaultFields);
        const parsedCustom = parseList(customFields);

        if (parsedDefault) fields['default_fields'] = parsedDefault;
        if (parsedCustom) fields['custom_fields'] = parsedCustom;

        if (!parsedDefault && !parsedCustom) {
            throw new context.CancelError('At least one of Default Fields or Custom Fields must be provided.');
        }

        const authConfig = {
            username: auth.apiKey,
            password: 'X'
        };
        const baseUrl = `https://${auth.domain}.freshdesk.com/api/v2`;

        // Step 1: Initiate the export
        const exportResponse = await axios.post(
            `${baseUrl}/contacts/export`,
            { fields },
            { auth: authConfig }
        );

        const exportId = exportResponse.data && exportResponse.data.id;
        if (!exportId) {
            throw new Error('Freshdesk export did not return an export ID.');
        }

        await context.log({ step: 'Export initiated', exportId });

        // Step 2: Poll until the export is ready
        const deadline = Date.now() + POLL_TIMEOUT_MS;
        let exportUrl = null;

        while (Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

            const statusResponse = await axios.get(
                `${baseUrl}/contacts/export/${exportId}`,
                { auth: authConfig }
            );

            const { status, export_url: url } = statusResponse.data;
            await context.log({ step: 'Export poll', exportId, status });

            if (status === 'completed' && url) {
                exportUrl = url;
                break;
            }

            if (status === 'failed') {
                throw new Error(`Freshdesk contact export failed (id: ${exportId}).`);
            }
        }

        if (!exportUrl) {
            throw new Error(`Freshdesk contact export timed out after ${POLL_TIMEOUT_MS / 1000}s (id: ${exportId}).`);
        }

        // Step 3: Stream the file directly into Appmixer file storage
        const downloadResponse = await axios.get(exportUrl, { responseType: 'stream' });
        const fileName = `freshdesk-contacts-export-${exportId}.csv`;

        const savedFile = await context.saveFileStream(fileName, downloadResponse.data);
        await context.log({ step: 'File saved', fileName, fileId: savedFile.fileId });

        return context.sendJson({ fileId: savedFile.fileId }, 'out');
    }
};
