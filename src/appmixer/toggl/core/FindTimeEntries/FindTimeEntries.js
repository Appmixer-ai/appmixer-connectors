'use strict';

const lib = require('../../lib');

// Output contract of one time entry. Exported because the `out` port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'workspace_id', 'start', 'duration'],
    properties: {
        id: { type: 'integer', title: 'Time Entry ID', example: 4123456789 },
        workspace_id: { type: 'integer', title: 'Workspace ID', example: 1234567 },
        project_id: { type: 'integer', title: 'Project ID', example: 203456789 },
        task_id: { type: 'integer', title: 'Task ID', example: 98765432 },
        user_id: { type: 'integer', title: 'User ID', example: 5551234 },
        description: { type: 'string', title: 'Description', example: 'Write release notes' },
        start: { type: 'string', format: 'date-time', title: 'Start', example: '2026-11-18T09:00:00+00:00' },
        stop: { type: 'string', format: 'date-time', title: 'Stop', example: '2026-11-18T10:30:00+00:00' },
        duration: { type: 'integer', title: 'Duration (seconds)', example: 5400 },
        billable: { type: 'boolean', title: 'Billable', example: false },
        tags: { type: 'array', title: 'Tags', items: { type: 'string' }, example: ['release'] },
        tag_ids: { type: 'array', title: 'Tag IDs', items: { type: 'integer' }, example: [16123456] },
        at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-18T10:30:05+00:00' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { startDate, endDate, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Time Entries' });
        }

        if ((startDate && !endDate) || (!startDate && endDate)) {
            throw new context.CancelError('Start Date and End Date must be used together.');
        }

        const params = {};
        if (startDate) {
            params.start_date = lib.toTogglTime(context, startDate, 'Start Date');
            params.end_date = lib.toTogglTime(context, endDate, 'End Date');
        }

        const records = await lib.listMyTimeEntries(context, params);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
