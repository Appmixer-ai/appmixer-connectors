'use strict';

const axios = require('axios');

const POLL_INTERVAL_MS = 30000;   // re-check every 30s
const MAX_POLLS = 60;             // up to 30 minutes total (60 × 30s)

module.exports = {

    async receive(context) {

        const { auth } = context;

        // ── Resumed from a timeout (polling tick) ───────────────────────────
        if (context.messages.timeout) {
            const { exportId, polls } = context.messages.timeout.content;
            return poll(context, auth, exportId, polls);
        }

        // ── First invocation ─────────────────────────────────────────────────
        const { defaultFields, customFields } = context.messages.in.content;

        const fields = {};
        const parsedDefault = parseList(defaultFields);
        const parsedCustom = parseList(customFields);

        if (parsedDefault) fields['default_fields'] = parsedDefault;
        if (parsedCustom) fields['custom_fields'] = parsedCustom;

        if (!parsedDefault && !parsedCustom) {
            throw new context.CancelError('At least one of Default Fields or Custom Fields must be provided.');
        }

        const baseUrl = `https://${auth.domain}.freshdesk.com/api/v2`;
        const authConfig = { username: auth.apiKey, password: 'X' };

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

        // Schedule the first poll
        await context.setTimeout({ exportId, polls: 0 }, POLL_INTERVAL_MS);
    }
};

/**
 * Parse a comma-separated string into a trimmed array, filtering empty values.
 */
function parseList(str) {

    if (!str) return undefined;
    const items = str.split(',').map(s => s.trim()).filter(Boolean);
    return items.length ? items : undefined;
}

/**
 * Called on each timeout tick — checks export status and either schedules
 * the next poll, streams the file, or throws on failure/timeout.
 */
async function poll(context, auth, exportId, polls) {

    if (polls >= MAX_POLLS) {
        throw new Error(`Freshdesk contact export timed out after ${(MAX_POLLS * POLL_INTERVAL_MS) / 1000}s (id: ${exportId}).`);
    }

    const baseUrl = `https://${auth.domain}.freshdesk.com/api/v2`;
    const authConfig = { username: auth.apiKey, password: 'X' };

    const statusResponse = await axios.get(
        `${baseUrl}/contacts/export/${exportId}`,
        { auth: authConfig }
    );

    const responseData = statusResponse.data;
    const status = responseData.status;
    const downloadUrl = responseData.download_url;

    await context.log({ step: 'Export poll', exportId, polls, status, downloadUrl });

    if (status === 'failed') {
        throw new Error(`Freshdesk contact export failed (id: ${exportId}).`);
    }

    if (downloadUrl) {
        // Stream the file directly into Appmixer file storage — no buffering
        const downloadResponse = await axios.get(downloadUrl, { responseType: 'stream' });
        const fileName = `freshdesk-contacts-export-${exportId}.csv`;
        const savedFile = await context.saveFileStream(fileName, downloadResponse.data);

        await context.log({ step: 'File saved', fileName, fileId: savedFile.fileId });
        return context.sendJson({ fileId: savedFile.fileId }, 'out');
    }

    // Still in progress — schedule next poll
    await context.setTimeout({ exportId, polls: polls + 1 }, POLL_INTERVAL_MS);
}
