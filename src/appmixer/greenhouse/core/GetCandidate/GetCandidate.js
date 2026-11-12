'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { candidateId: rawId } = context.messages.in.content;

        if (!rawId) {
            throw new context.CancelError('Candidate ID is required!');
        }
        const candidateId = lib.toId(context, rawId, 'Candidate ID', { required: true });

        const candidate = await lib.getById(context, '/v3/candidates', candidateId, 'Candidate');
        return context.sendJson(candidate, 'out');
    }
};
