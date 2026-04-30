'use strict';

const api = require('../../api');
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            organization,
            project,
            workItemType,
            title,
            description,
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
        if (!workItemType) {
            throw new context.CancelError('Work Item Type is required!');
        }
        if (!title) {
            throw new context.CancelError('Title is required!');
        }

        const workItem = await api.CreateWorkItem.execute(context, {
            organization,
            project,
            workItemType,
            title,
            description,
            priority,
            assignedTo,
            areaPath,
            iterationPath,
            tags
        });

        if (!workItem || typeof workItem !== 'object') {
            throw new context.CancelError('Unexpected response from Azure DevOps API. '
                + 'Please verify the organization name and ensure your connected account has access to this Azure DevOps organization.');
        }

        return context.sendJson(lib.expandDottedKeys(workItem), 'out');
    }
};
