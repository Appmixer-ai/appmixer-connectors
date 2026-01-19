'use strict';

const lib = require('../../lib');

const taskSchema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'assigner_id': { 'type': 'string', 'title': 'Assigner ID' },
    'assignee_id': { 'type': 'string', 'title': 'Assignee ID' },
    'project_id': { 'type': 'string', 'title': 'Project ID' },
    'section_id': { 'type': 'string', 'title': 'Section ID' },
    'parent_id': { 'type': 'string', 'title': 'Parent ID' },
    'order': { 'type': 'integer', 'title': 'Order' },
    'content': { 'type': 'string', 'title': 'Content' },
    'description': { 'type': 'string', 'title': 'Description' },
    'is_completed': { 'type': 'boolean', 'title': 'Is Completed' },
    'labels': { 'type': 'array', 'title': 'Labels' },
    'priority': { 'type': 'integer', 'title': 'Priority' },
    'comment_count': { 'type': 'integer', 'title': 'Comment Count' },
    'creator_id': { 'type': 'string', 'title': 'Creator ID' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'due.date': { 'type': 'string', 'title': 'Due Date' },
    'due.string': { 'type': 'string', 'title': 'Due String' },
    'due.is_recurring': { 'type': 'boolean', 'title': 'Due Is Recurring' },
    'due.datetime': { 'type': 'string', 'title': 'Due Datetime' },
    'due.timezone': { 'type': 'string', 'title': 'Due Timezone' },
    'duration.amount': { 'type': 'integer', 'title': 'Duration Amount' },
    'duration.unit': { 'type': 'string', 'title': 'Duration Unit' },
    'url': { 'type': 'string', 'title': 'URL' }
};

module.exports = {

    async receive(context) {

        const { projectId, sectionId, labelId, filter, lang, ids, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return context.sendJson(lib.getOutputPortSchema(taskSchema, outputType || 'array', 'Tasks'), 'out');
        }

        const params = {};

        if (projectId) params.project_id = projectId;
        if (sectionId) params.section_id = sectionId;
        if (labelId) params.label = labelId;
        if (filter) params.filter = filter;
        if (lang) params.lang = lang;
        if (ids) params.ids = ids;

        const tasks = await lib.apiRequest(context, '/tasks', { params });

        return lib.sendArrayOutput({
            context,
            outputType: outputType || 'array',
            records: tasks
        });
    }
};
