'use strict';
const commons = require('../../asana-commons');

/**
 * Component which deletes a task if triggered.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {
        if (!context.messages.in.content.workspace) {
            throw new context.CancelError('Workspace is required');
        }

        if (!context.messages.in.content.project) {
            throw new context.CancelError('Project is required');
        }

        if (!context.messages.in.content.task) {
            throw new context.CancelError('Task is required');
        }


        const client = commons.getAsanaAPI(context.auth.accessToken);
        let { task } = context.messages.in.content;

        await client.tasks.delete(task);

        return context.sendJson({ gid: task }, 'deleted');
    }
};
