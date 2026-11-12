'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.candidateId) {
            throw new context.CancelError('Candidate ID is required!');
        }
        const candidateId = lib.toId(context, input.candidateId, 'Candidate ID', { required: true });

        const body = lib.buildCandidateBody(input);
        if (!Object.keys(body).length) {
            throw new context.CancelError('Fill in at least one field to update.');
        }

        await lib.apiRequest(context, { method: 'PATCH', path: '/v3/candidates/' + candidateId, data: body });

        return context.sendJson({}, 'out');
    }
};
