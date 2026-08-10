'use strict';

const lib = require('../../lib');

const PAGE_LIMIT = 50;

module.exports = {

    async tick(context) {

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${lib.getBaseUrl(context)}/v2/transcript`,
            headers: lib.getHeaders(context),
            params: { limit: PAGE_LIMIT }
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
            await context.sendJson(summary, 'transcript');
        }

        await context.saveState({ seen: currentIds });
    },

    async test(context) {

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${lib.getBaseUrl(context)}/v2/transcript`,
            headers: lib.getHeaders(context),
            params: { limit: 1 }
        });

        const summary = data && Array.isArray(data.transcripts) ? data.transcripts[0] : null;
        if (!summary) {
            throw new Error('No transcript to use as test data.');
        }
        return context.sendJson(summary, 'transcript');
    }
};
