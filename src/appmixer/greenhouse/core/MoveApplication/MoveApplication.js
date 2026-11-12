'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.applicationId) {
            throw new context.CancelError('Application ID is required!');
        }
        const applicationId = lib.toId(context, input.applicationId, 'Application ID', { required: true });
        const toStageId = lib.toId(context, input.toStageId, 'Stage');
        const toJobId = lib.toId(context, input.toJobId, 'Transfer To Job');
        let fromStageId = lib.toId(context, input.fromStageId, 'Current Stage ID');

        if (!fromStageId) {
            const application = await lib.getById(context, '/v3/applications', applicationId, 'Application');
            if (!application.job_interview_stage_id) {
                throw new context.CancelError(
                    'Application ' + applicationId + ' is not in an interview stage (status: ' + application.status + ').'
                );
            }
            fromStageId = String(application.job_interview_stage_id);
        }

        const body = { from_stage_id: Number(fromStageId) };
        if (toStageId) {
            body.to_stage_id = Number(toStageId);
        }
        if (toJobId) {
            body.to_job_id = Number(toJobId);
        }

        await lib.apiRequest(context, { method: 'POST', path: '/v3/applications/' + applicationId + '/move', data: body });

        return context.sendJson({}, 'out');
    }
};
