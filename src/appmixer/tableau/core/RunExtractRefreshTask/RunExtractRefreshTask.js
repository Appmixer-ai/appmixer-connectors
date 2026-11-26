'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        // The job is checked again by the continuation that waitForJob() schedules, until it finishes.
        if (context.messages.timeout) {
            return lib.continueJobWait(context);
        }

        const { taskId, timeout, failOnUnsuccessfulJob } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/tasks/extractRefreshes/' + lib.encodeId(taskId) + '/runNow',
            data: {}
        });

        return lib.waitForJob(context, data.job, timeout, { failOnUnsuccessful: failOnUnsuccessfulJob });
    }
};
