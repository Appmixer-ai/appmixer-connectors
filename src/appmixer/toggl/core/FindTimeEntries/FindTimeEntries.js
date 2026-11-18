'use strict';

const lib = require('../../lib');

// Output contract of one time entry. Exported because the `out` port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'workspace_id', 'type'],
    properties: {
        id: { type: 'integer', title: 'Time Entry ID', example: 247977688 },
        workspace_id: { type: 'integer', title: 'Workspace ID', example: 21808213 },
        project_id: { type: 'integer', title: 'Project ID', example: 5302177 },
        task_id: { type: 'integer', title: 'Task ID', example: 18514337 },
        toggl_user_id: { type: 'integer', title: 'User ID', example: 7987332 },
        type: { type: 'string', title: 'Type', example: 'activity' },
        description: { type: 'string', title: 'Description', example: 'Write release notes' },
        start: { type: 'string', format: 'date-time', title: 'Start', example: '2026-11-18T09:00:00Z' },
        stop: { type: 'string', format: 'date-time', title: 'Stop', example: '2026-11-18T10:30:00.000Z' },
        duration: { type: 'integer', title: 'Duration (seconds)', example: 5400 },
        billable: { type: 'boolean', title: 'Billable', example: false },
        tag_ids: { type: 'array', title: 'Tag IDs', items: { type: 'integer' }, example: [16123] },
        timezone: { type: 'string', title: 'Time Zone', example: 'Europe/Prague' },
        created_at: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-11-18T10:30:05.655129Z' },
        updated_at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-18T10:30:05.655129Z' }
    }
};

// Without dates the component returns the entries of the last 7 days.
const DEFAULT_RANGE = 7 * 24 * 60 * 60 * 1000;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { startDate, endDate, projectId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Time Entries' });
        }

        if ((startDate && !endDate) || (!startDate && endDate)) {
            throw new context.CancelError('Start Date and End Date must be used together.');
        }

        const now = Date.now();
        const records = await lib.listTimeEntries(context, {
            from: lib.toTogglTime(context, startDate, 'Start Date') || new Date(now - DEFAULT_RANGE).toISOString(),
            to: lib.toTogglTime(context, endDate, 'End Date') || new Date(now).toISOString(),
            projectId: lib.optionalId(context, projectId, 'Project')
        });

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
