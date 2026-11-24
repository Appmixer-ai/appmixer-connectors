'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, entity, type, description, projectId } = context.messages.in.content;
        if (!name) {
            throw new context.CancelError('Name is required!');
        }
        if (!entity) {
            throw new context.CancelError('Entity is required!');
        }
        if (!type) {
            throw new context.CancelError('Type is required!');
        }

        const customfield = { name, entity, type };
        if (description) {
            customfield.description = description;
        }
        if (projectId) {
            customfield.projectId = Number(projectId);
        }

        const resp = await lib.callAPI(context, 'POST', '/projects/api/v3/customfields.json', { customfield });

        return context.sendJson(resp.customfield, 'out');
    }
};
