'use strict';

const lib = require('../../lib');

const PATH = '/v3/applications';

function filters(context) {

    const { jobId, status } = context.properties;
    const params = {};
    const job = lib.toId(context, jobId, 'Job');
    if (job) {
        params.job_ids = job;
    }
    if (status) {
        params.status = status;
    }
    return params;
}

module.exports = {

    async tick(context) {

        return lib.withTickLock(context, async () => {
            const applications = await lib.pollNewRecords(context, {
                path: PATH,
                field: 'updated_at',
                params: filters(context),
                // A change is a new updated_at of the same application.
                keyOf: application => application.id + '@' + application.updated_at
            });
            for (const application of applications || []) {
                await context.sendJson(application, 'out');
            }
        });
    },

    async test(context) {

        const { records } = await lib.listPage(context, PATH, { ...filters(context), per_page: 1 });
        if (!records.length) {
            throw new context.CancelError('There are no applications matching the trigger settings yet. '
                + 'Add a candidate to a job in Greenhouse to get test data.');
        }
        return context.sendJson(records[0], 'out');
    }
};
