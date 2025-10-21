'use strict';
const commons = require('../../asana-commons');

/**
 * Component which deletes a project if triggered.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const client = commons.getAsanaAPI(context.auth.accessToken);
        const { project } = context.messages.in.content;
        if (!workspace) {
            throw new context.CancelError('Workspace is required');
        }

        if (!project) {
            throw new context.CancelError('Project is required');
        }


        await client.projects.delete(project);

        return context.sendJson({ gid: project }, 'deleted');
    }
};
