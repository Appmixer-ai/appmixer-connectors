'use strict';

const api = require('../../api');
const lib = require('../../lib');

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

        const workItem = await api.GetWorkItem.execute(context, { organization, project, workItemId });

        if (!workItem || typeof workItem !== 'object') {
            throw new context.CancelError('Unexpected response from Azure DevOps API. '
                + 'Please verify the organization name and ensure your connected account has access to this Azure DevOps organization.');
        }

        return context.sendJson(lib.expandDottedKeys(workItem), 'out');
    }
};
