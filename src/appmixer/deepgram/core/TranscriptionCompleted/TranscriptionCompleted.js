'use strict';

const lib = require('../../lib');

// Fetch successful transcription (/v1/listen) requests. Shared by tick() and test().
async function fetchCompletedTranscriptions(context) {

    const { projectId } = context.properties;

    if (!projectId) {
        throw new context.CancelError('Project is required!');
    }

    const { data } = await lib.apiRequest(context, {
        method: 'GET',
        path: `/v1/projects/${encodeURIComponent(projectId)}/requests`,
        params: { status: 'succeeded', limit: 1000 }
    });

    return ((data && data.requests) || [])
        .filter(request => typeof request.path === 'string' && request.path.indexOf('/v1/listen') !== -1);
}

// Optionally attach the full stored result. Shared by tick() and test().
async function enrich(context, request, includeResult) {

    if (!includeResult) {
        return request;
    }

    const { projectId } = context.properties;
    try {
        const { data: full } = await lib.apiRequest(context, {
            method: 'GET',
            path: `/v1/projects/${encodeURIComponent(projectId)}/requests/${encodeURIComponent(request.request_id)}`
        });
        return { ...request, response: full && full.response ? full.response : full };
    } catch (error) {
        await context.log('error', `Failed to fetch full result for request ${request.request_id}`, { message: error.message });
        return request;
    }
}

module.exports = {

    async tick(context) {

        const { includeResult = true } = context.properties;
        const requests = await fetchCompletedTranscriptions(context);

        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const { diff, actual } = lib.getNewItems(known, requests, 'request_id');

        for (const request of diff) {
            const payload = await enrich(context, request, includeResult);
            await context.sendJson(payload, 'out');
        }

        await context.saveState({ known: actual });
    },

    // Flow Test Mode: emit the single most recent completed transcription, read-only, no state writes.
    async test(context) {

        const { includeResult = true } = context.properties;
        const requests = await fetchCompletedTranscriptions(context);
        if (!requests.length) {
            throw new Error('No recent completed transcriptions to use as test data.');
        }
        const payload = await enrich(context, requests[0], includeResult);
        return context.sendJson(payload, 'out');
    }
};
