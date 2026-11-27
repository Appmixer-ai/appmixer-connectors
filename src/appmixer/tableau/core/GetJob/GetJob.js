'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { jobId } = context.messages.in.content;

        if (!jobId) {
            throw new context.CancelError('Job ID is required!');
        }

        const { data } = await lib.apiRequest(context, { path: '/jobs/' + lib.encodeId(jobId) });

        return context.sendJson(lib.mapJob(data.job), 'out');
    }
};
