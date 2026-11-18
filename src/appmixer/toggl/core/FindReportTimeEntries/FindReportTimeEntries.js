'use strict';

const lib = require('../../lib');

// Output contract of one row of the detailed report (search/time_entries). The Reports API v3 reference does not document
// the response body, so only `time_entries` is required; verify against a live response.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['time_entries'],
    properties: {
        user_id: { type: 'integer', title: 'User ID', example: 5551234 },
        username: { type: 'string', title: 'Username', example: 'Jane Doe' },
        project_id: { type: 'integer', title: 'Project ID', example: 203456789 },
        task_id: { type: 'integer', title: 'Task ID', example: 98765432 },
        description: { type: 'string', title: 'Description', example: 'Write release notes' },
        billable: { type: 'boolean', title: 'Billable', example: false },
        tag_ids: { type: 'array', title: 'Tag IDs', items: { type: 'integer' }, example: [16123456] },
        billable_amount_in_cents: { type: 'integer', title: 'Billable Amount (cents)', example: 15000 },
        hourly_rate_in_cents: { type: 'integer', title: 'Hourly Rate (cents)', example: 10000 },
        currency: { type: 'string', title: 'Currency', example: 'USD' },
        row_number: { type: 'integer', title: 'Row Number', example: 1 },
        time_entries: {
            type: 'array',
            title: 'Time Entries',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'integer', title: 'Time Entry ID' },
                    seconds: { type: 'integer', title: 'Seconds' },
                    start: { type: 'string', title: 'Start' },
                    stop: { type: 'string', title: 'Stop' },
                    at: { type: 'string', title: 'Updated At' }
                }
            },
            example: [{ id: 4123456789, seconds: 5400, start: '2026-11-18T09:00:00+00:00', stop: '2026-11-18T10:30:00+00:00', at: '2026-11-18T10:30:05+00:00' }]
        }
    }
};

// The documented default page size of the detailed report.
const PAGE_SIZE = 50;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            workspaceId,
            startDate,
            endDate,
            description,
            projectIds,
            clientIds,
            userIds,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Rows' });
        }

        if (!startDate) {
            throw new context.CancelError('Start Date is required!');
        }
        if (!endDate) {
            throw new context.CancelError('End Date is required!');
        }

        const resolvedWorkspaceId = await lib.resolveWorkspaceId(context, workspaceId);

        const body = {
            start_date: lib.toDateOnly(context, startDate, 'Start Date'),
            end_date: lib.toDateOnly(context, endDate, 'End Date'),
            page_size: PAGE_SIZE
        };
        if (description) body.description = description;
        const projects = lib.idList(context, projectIds, 'Project IDs');
        if (projects.length) body.project_ids = projects;
        const clients = lib.idList(context, clientIds, 'Client IDs');
        if (clients.length) body.client_ids = clients;
        const users = lib.idList(context, userIds, 'User IDs');
        if (users.length) body.user_ids = users;

        const { data } = await lib.request(context, {
            method: 'POST',
            url: `${lib.REPORTS_BASE_URL}/workspace/${resolvedWorkspaceId}/search/time_entries`,
            data: body
        });

        const records = Array.isArray(data) ? data : [];
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
