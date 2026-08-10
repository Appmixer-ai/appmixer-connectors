'use strict';

const lib = require('../../lib');

const PAGE_LIMIT = 50;

module.exports = {

    async tick(context) {

        const baseUrl = lib.getBaseUrl(context);
        const headers = lib.getHeaders(context);
        const includeFull = context.properties.includeFullTranscript !== false;

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/v2/transcript`,
            headers,
            params: { limit: PAGE_LIMIT, status: 'completed' }
        });

        const transcripts = (data && data.transcripts) || [];
        const currentIds = transcripts.map(t => t.id);

        // First poll establishes a baseline and does not emit.
        const seen = Array.isArray(context.state.seen) ? new Set(context.state.seen) : null;
        if (seen === null) {
            await context.saveState({ seen: currentIds });
            return;
        }

        const fresh = transcripts.filter(t => !seen.has(t.id));

        for (const summary of fresh) {
            let payload = summary;
            if (includeFull) {
                const { data: full } = await context.httpRequest({
                    method: 'GET',
                    url: `${baseUrl}/v2/transcript/${summary.id}`,
                    headers
                });
                payload = full;
            }
            await context.sendJson(payload, 'transcript');
        }

        await context.saveState({ seen: currentIds });
    },

    async test(context) {

        const baseUrl = lib.getBaseUrl(context);
        const headers = lib.getHeaders(context);

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/v2/transcript`,
            headers,
            params: { limit: 1, status: 'completed' }
        });

        const summary = data && Array.isArray(data.transcripts) ? data.transcripts[0] : null;
        if (!summary) {
            throw new Error('No completed transcript to use as test data.');
        }

        if (context.properties.includeFullTranscript !== false) {
            const { data: full } = await context.httpRequest({
                method: 'GET',
                url: `${baseUrl}/v2/transcript/${summary.id}`,
                headers
            });
            return context.sendJson(full, 'transcript');
        }

        return context.sendJson(summary, 'transcript');
    }
};
