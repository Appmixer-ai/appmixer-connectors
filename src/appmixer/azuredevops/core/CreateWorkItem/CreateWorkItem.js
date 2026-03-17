'use strict';

const api = require('../../api');

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

        return context.sendJson(workItem, 'out');
    }
};
