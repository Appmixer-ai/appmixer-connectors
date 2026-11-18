'use strict';

const lib = require('../../lib');

// Output contract of one report row: a time entry of any workspace member the caller may see
// in reports. Exported because the `out` port is dynamic. The keys are the report properties
// requested below (POST /reports/workspaces/{workspace_id}/query, response_format=json_row).
const ITEM_SCHEMA = {
    type: 'object',
    required: ['time_entry_id'],
    properties: {
        time_entry_id: { type: 'integer', title: 'Time Entry ID', example: 247977688 },
        description: { type: 'string', title: 'Description', example: 'Write release notes' },
        start_utc: { type: 'string', format: 'date-time', title: 'Start (UTC)', example: '2026-11-18T08:00:00+00:00' },
        stop: { type: 'string', format: 'date-time', title: 'Stop (UTC)', example: '2026-11-18T08:10:00.000Z' },
        duration: { type: 'integer', title: 'Duration (seconds)', example: 600 },
        time_entry_billable: { type: 'boolean', title: 'Billable', example: false },
        user_account_id: { type: 'integer', title: 'User ID', example: 7987332 },
        user_name: { type: 'string', title: 'User Name', example: 'Jane Doe' },
        project_id: { type: 'integer', title: 'Project ID', example: 5302177 },
        project_name: { type: 'string', title: 'Project Name', example: 'Website Redesign' },
        client_id: { type: 'integer', title: 'Client ID', example: 953805 },
        client_name: { type: 'string', title: 'Client Name', example: 'Acme' },
        task_id: { type: 'integer', title: 'Task ID', example: 18514337 },
        task_name: { type: 'string', title: 'Task Name', example: 'Draft the homepage' },
        tag_names: { type: 'array', title: 'Tag Names', items: { type: 'string' }, example: ['release'] },
        updated_at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-18T14:34:34.655129+00:00' }
    }
};

const PAGE_SIZE = 100;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
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

        const filters = [];
        if (description) filters.push({ property: 'description', operator: 'contains', value: description });
        const projects = lib.idList(context, projectIds, 'Project IDs');
        if (projects.length) filters.push({ property: 'project_id', operator: 'in', value: projects });
        const clients = lib.idList(context, clientIds, 'Client IDs');
        if (clients.length) filters.push({ property: 'client_id', operator: 'in', value: clients });
        const users = lib.idList(context, userIds, 'User IDs');
        if (users.length) filters.push({ property: 'user_account_id', operator: 'in', value: users });

        const body = {
            // `stop` is not requested: the report returns it in local time without a zone. It is
            // computed from start_utc and duration instead.
            attributes: Object.keys(ITEM_SCHEMA.properties)
                .filter(property => property !== 'stop')
                .map(property => ({ property })),
            period: {
                from: lib.toDateOnly(context, startDate, 'Start Date'),
                to: lib.toDateOnly(context, endDate, 'End Date')
            },
            ordinations: [{ property: 'start_utc', direction: 'desc' }]
        };
        if (filters.length) body.filters = filters;

        const { reports } = await lib.urls(context);
        const records = [];
        for (let page = 1; page <= lib.MAX_PAGES; page++) {
            const { data } = await lib.request(context, {
                method: 'POST',
                url: `${reports}/query`,
                params: { response_format: 'json_row' },
                data: { ...body, pagination: { page, per_page: PAGE_SIZE } }
            });
            const rows = data && Array.isArray(data.data_json_row) ? data.data_json_row : [];
            // A row without a project carries project_id 0 and null names.
            records.push(...rows.map(row => {
                const record = lib.withoutNulls(row);
                if (record.project_id === 0) delete record.project_id;
                const start = new Date(record.start_utc).getTime();
                if (!isNaN(start) && Number.isFinite(record.duration)) {
                    record.stop = new Date(start + record.duration * 1000).toISOString();
                }
                return record;
            }));
            if (rows.length < PAGE_SIZE) {
                break;
            }
        }

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
