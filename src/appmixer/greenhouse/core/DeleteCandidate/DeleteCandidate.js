'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { candidateId: rawId } = context.messages.in.content;

        if (!rawId) {
            throw new context.CancelError('Candidate ID is required!');
        }
        const candidateId = lib.toId(context, rawId, 'Candidate ID', { required: true });

        await lib.apiRequest(context, { method: 'DELETE', path: '/v3/candidates/' + candidateId });

        return context.sendJson({}, 'out');
    }
};
