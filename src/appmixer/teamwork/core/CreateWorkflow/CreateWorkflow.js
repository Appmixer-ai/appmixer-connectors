'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name } = context.messages.in.content;
        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        // Teamwork answers 500 when workflowOptions is missing.
        const body = {
            workflow: { name, projectSpecific: false, status: 'active' },
            workflowOptions: {}
        };
        const resp = await lib.callAPI(context, 'POST', '/projects/api/v3/workflows.json', body);

        return context.sendJson(resp.workflow, 'out');
    }
};
