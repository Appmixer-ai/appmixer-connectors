'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workflowId, name, color, showCompletedTasks } = context.messages.in.content;
        if (!workflowId) {
            throw new context.CancelError('Workflow is required!');
        }
        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const stage = { name, showCompletedTasks: !!showCompletedTasks };
        if (color) {
            stage.color = color;
        }
        const resp = await lib.callAPI(
            context,
            'POST',
            `/projects/api/v3/workflows/${encodeURIComponent(workflowId)}/stages.json`,
            { stage, stageOptions: {} }
        );

        return context.sendJson({ ...resp.stage, workflowId: Number(workflowId) }, 'out');
    }
};
