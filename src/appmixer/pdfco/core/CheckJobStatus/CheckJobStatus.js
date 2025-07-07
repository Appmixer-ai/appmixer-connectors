
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { jobId } = context.messages.in.content;

        // https://apidocs.pdf.co/?#job-status
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.pdf.co/v1/job/check',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
