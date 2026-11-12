'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.applicationId) {
            throw new context.CancelError('Application ID is required!');
        }
        if (!input.rejectionReasonId) {
            throw new context.CancelError('Rejection Reason is required!');
        }
        const applicationId = lib.toId(context, input.applicationId, 'Application ID', { required: true });
        const rejectionReasonId = lib.toId(context, input.rejectionReasonId, 'Rejection Reason', { required: true });

        const body = { rejection_reason_id: Number(rejectionReasonId) };
        if (input.notes) {
            body.notes = input.notes;
        }

        await lib.apiRequest(context, { method: 'POST', path: '/v3/applications/' + applicationId + '/reject', data: body });

        return context.sendJson({}, 'out');
    }
};
