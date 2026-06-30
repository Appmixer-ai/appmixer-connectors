'use strict';

const lib = require('../../lib');

const commentSchema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'task_id': { 'type': 'string', 'title': 'Task ID' },
    'project_id': { 'type': 'string', 'title': 'Project ID' },
    'posted_at': { 'type': 'string', 'title': 'Posted At' },
    'content': { 'type': 'string', 'title': 'Content' },
    'posted_by_id': { 'type': 'string', 'title': 'Posted By ID' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' },
    'attachment': { 'type': 'object', 'title': 'Attachment' },
    'upload_id': { 'type': 'string', 'title': 'Upload ID' },
    'reactions': { 'type': 'object', 'title': 'Reactions' },
    'uids_to_notify': { 'type': 'array', 'title': 'UIDs To Notify' }
};

module.exports = {

    async receive(context) {

        const { taskId, projectId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return context.sendJson(lib.getOutputPortSchema(commentSchema, outputType || 'array', 'Comments'), 'out');
        }

        if (!taskId && !projectId) {
            throw new context.CancelError('Either Task ID or Project ID is required.');
        }

        const params = {};
        if (taskId) {
            params.task_id = taskId;
        }
        if (projectId) {
            params.project_id = projectId;
        }

        const comments = await lib.apiRequest(context, '/comments', { params });

        return lib.sendArrayOutput({
            context,
            outputType: outputType || 'array',
            records: comments
        });
    }
};
