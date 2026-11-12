'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.firstName) {
            throw new context.CancelError('First Name is required!');
        }
        if (!input.lastName) {
            throw new context.CancelError('Last Name is required!');
        }

        const body = lib.buildCandidateBody(input);
        const jobId = lib.toId(context, input.jobId, 'Job');
        if (jobId) {
            body.application = { job_id: Number(jobId) };
        }

        const { data } = await lib.apiRequest(context, { method: 'POST', path: '/v3/candidates', data: body });

        const candidate = data.candidate || {};
        const application = data.application || {};
        return context.sendJson({ ...candidate, applicationId: application.id }, 'out');
    }
};
