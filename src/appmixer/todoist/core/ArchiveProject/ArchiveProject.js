'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { projectId } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required.');
        }

        // Archive uses the Sync API
        const uuid = context.componentId + '-' + Date.now();

        await lib.syncApiRequest(context, [
            {
                type: 'project_archive',
                uuid,
                args: { id: projectId }
            }
        ]);

        return context.sendJson({}, 'out');
    }
};
