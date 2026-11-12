'use strict';

const lib = require('../../lib');

const PATH = '/v3/candidates';

module.exports = {

    async tick(context) {

        return lib.withTickLock(context, async () => {
            const candidates = await lib.pollNewRecords(context, {
                path: PATH,
                field: 'created_at',
                keyOf: candidate => String(candidate.id)
            });
            for (const candidate of candidates || []) {
                await context.sendJson(candidate, 'out');
            }
        });
    },

    async test(context) {

        // The newest candidate: Harvest v3 lists by id, newest first.
        const { records } = await lib.listPage(context, PATH, { per_page: 1 });
        if (!records.length) {
            throw new context.CancelError('There are no candidates yet. Add a candidate in Greenhouse to get test data.');
        }
        return context.sendJson(records[0], 'out');
    }
};
