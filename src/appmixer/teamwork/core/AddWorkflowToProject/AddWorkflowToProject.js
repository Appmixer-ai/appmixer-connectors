'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { projectId, workflowId } = context.messages.in.content;
        if (!projectId) {
            throw new context.CancelError('Project is required!');
        }
        if (!workflowId) {
            throw new context.CancelError('Workflow is required!');
        }

        await lib.callAPI(
            context,
            'POST',
            `/projects/api/v3/projects/${encodeURIComponent(projectId)}/workflows.json`,
            { workflow: { id: Number(workflowId) }, workflowOptions: {} }
        );

        return context.sendJson({}, 'out');
    }
};
