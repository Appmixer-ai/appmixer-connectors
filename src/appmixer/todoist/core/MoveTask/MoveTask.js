'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { taskId, projectId, sectionId, parentId } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        // The move operation uses the Sync API
        const uuid = context.componentId + '-' + Date.now();
        const args = { id: taskId };

        if (projectId) {
            args.project_id = projectId;
        }

        if (sectionId) {
            args.section_id = sectionId;
        }

        if (parentId) {
            args.parent_id = parentId;
        }

        await lib.syncApiRequest(context, [
            {
                type: 'item_move',
                uuid,
                args
            }
        ]);

        return context.sendJson({}, 'out');
    }
};
