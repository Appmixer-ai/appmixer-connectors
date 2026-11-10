'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { jobId } = context.messages.in.content;

        if (!jobId) {
            throw new context.CancelError('Job ID is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: `/v1/jobs/${encodeURIComponent(String(jobId).trim())}`
        });

        return context.sendJson(response || {}, 'out');
    }
};
