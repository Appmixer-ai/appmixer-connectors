'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, projectId, order } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        const body = {
            name,
            project_id: projectId
        };

        if (order !== undefined) {
            body.order = order;
        }

        const section = await lib.apiRequest(context, '/sections', {
            method: 'POST',
            data: body
        });

        return context.sendJson(section, 'out');
    }
};
