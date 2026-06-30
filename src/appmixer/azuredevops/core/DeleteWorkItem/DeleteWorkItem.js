'use strict';

const api = require('../../api');

module.exports = {

    async receive(context) {

        const { organization, project, workItemId } = context.messages.in.content;

        if (!organization) {
            throw new context.CancelError('Organization is required!');
        }
        if (!project) {
            throw new context.CancelError('Project is required!');
        }
        if (!workItemId) {
            throw new context.CancelError('Work Item ID is required!');
        }

        await api.DeleteWorkItem.execute(context, { organization, project, workItemId });

        return context.sendJson({}, 'out');
    }
};
