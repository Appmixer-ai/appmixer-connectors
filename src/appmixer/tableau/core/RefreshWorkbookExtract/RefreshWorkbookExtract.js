'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        // The job is checked again by the continuation that waitForJob() schedules, until it finishes.
        if (context.messages.timeout) {
            return lib.continueJobWait(context);
        }

        const { workbookId, timeout, incremental, failOnUnsuccessfulJob } = context.messages.in.content;

        if (!workbookId) {
            throw new context.CancelError('Workbook ID is required!');
        }

        const { data } = await lib.startExtractRefresh(context, '/workbooks/' + lib.encodeId(workbookId) + '/refresh', incremental);

        return lib.waitForJob(context, data.job, timeout, { failOnUnsuccessful: failOnUnsuccessfulJob });
    }
};
