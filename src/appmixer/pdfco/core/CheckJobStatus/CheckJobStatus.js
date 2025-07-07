
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { jobId } = context.messages.in.content;

        if (!jobId) {
            throw new Error('JobId parameter is required');
        }

        // https://apidocs.pdf.co/?#job-status
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.pdf.co/v1/job/check?jobid=${encodeURIComponent(jobId)}`,
            headers: {
                'x-api-key': context.apiKey
            }
        });

        return context.sendJson(data, 'out');
    }
};
