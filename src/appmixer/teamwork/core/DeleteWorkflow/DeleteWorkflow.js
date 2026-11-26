'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workflowId } = context.messages.in.content;
        if (!workflowId) {
            throw new context.CancelError('Workflow is required!');
        }

        await lib.callAPI(context, 'DELETE', `/projects/api/v3/workflows/${encodeURIComponent(workflowId)}.json`);

        return context.sendJson({}, 'out');
    }
};
