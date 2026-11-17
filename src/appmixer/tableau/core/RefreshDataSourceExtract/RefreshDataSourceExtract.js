'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        // The job is checked again by the continuation that waitForJob() schedules, until it finishes.
        if (context.messages.timeout) {
            return lib.continueJobWait(context);
        }

        const { datasourceId, timeout } = context.messages.in.content;

        if (!datasourceId) {
            throw new context.CancelError('Data Source ID is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/datasources/' + lib.encodeId(datasourceId) + '/refresh',
            data: {}
        });

        return lib.waitForJob(context, data.job, timeout);
    }
};
