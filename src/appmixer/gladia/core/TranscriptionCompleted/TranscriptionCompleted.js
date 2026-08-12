'use strict';

const lib = require('../../lib');

const PAGE_SIZE = 50;

module.exports = {

    async tick(context) {

        const data = await lib.makeRequest({
            context,
            method: 'GET',
            path: '/v2/pre-recorded',
            params: { status: 'done', limit: PAGE_SIZE }
        });

        const items = (data && data.items) || [];

        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const actual = [];
        const diff = [];

        for (const item of items) {
            actual.push(item.id);
            // On the first tick `known` is null: establish a baseline without
            // emitting the existing backlog of completed jobs.
            if (known && !known.has(item.id)) {
                diff.push(item);
            }
        }

        for (const item of diff) {
            await context.sendJson(item, 'out');
        }

        await context.saveState({ known: actual });
    },

    // Flow Test Mode: emit the most recent completed transcription without
    // touching state.
    async test(context) {

        const data = await lib.makeRequest({
            context,
            method: 'GET',
            path: '/v2/pre-recorded',
            params: { status: 'done', limit: 1 }
        });

        const item = data && data.items && data.items[0];

        if (!item) {
            throw new Error('No completed transcriptions available to use as test data.');
        }

        return context.sendJson(item, 'out');
    }
};
