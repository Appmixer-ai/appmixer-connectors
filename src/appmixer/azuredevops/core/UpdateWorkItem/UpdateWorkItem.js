'use strict';

const api = require('../../api');
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            organization,
            project,
            workItemId,
            title,
            description,
            state,
            priority,
            assignedTo,
            areaPath,
            iterationPath,
            tags
        } = context.messages.in.content;

        if (!organization) {
            throw new context.CancelError('Organization is required!');
        }
        if (!project) {
            throw new context.CancelError('Project is required!');
        }
        if (!workItemId) {
            throw new context.CancelError('Work Item ID is required!');
        }

        const workItem = await api.UpdateWorkItem.execute(context, {
            organization,
            project,
            workItemId,
            title,
            description,
            state,
            priority,
            assignedTo,
            areaPath,
            iterationPath,
            tags
        });

        return context.sendJson(lib.expandDottedKeys(workItem), 'out');
    }
};
