'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        // The job is checked again by the continuation that waitForJob() schedules, until it finishes.
        if (context.messages.timeout) {
            return lib.continueJobWait(context);
        }

        const { datasourceId, timeout, incremental, failOnUnsuccessfulJob } = context.messages.in.content;

        if (!datasourceId) {
            throw new context.CancelError('Data Source ID is required!');
        }

        const { data } = await lib.startExtractRefresh(context, '/datasources/' + lib.encodeId(datasourceId) + '/refresh', incremental);

        return lib.waitForJob(context, data.job, timeout, { failOnUnsuccessful: failOnUnsuccessfulJob });
    }
};
