'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            userId,
            clientId,
            projectId,
            taskId,
            isBilled,
            isRunning,
            approvalStatus,
            updatedSince,
            from,
            to,
            outputType
        } = context.messages.in.content;

        // Generate output port schema dynamically based on outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, timeEntrySchema, { label: 'Time Entries' });
        }

        const params = {};

        if (userId) {
            params.user_id = userId;
        }

        if (clientId) {
            params.client_id = clientId;
        }

        if (projectId) {
            params.project_id = projectId;
        }

        if (taskId) {
            params.task_id = taskId;
        }

        if (typeof isBilled === 'boolean') {
            params.is_billed = isBilled;
        }

        if (typeof isRunning === 'boolean') {
            params.is_running = isRunning;
        }

        if (approvalStatus) {
            params.approval_status = approvalStatus;
        }

        if (updatedSince) {
            params.updated_since = updatedSince;
        }

        if (from) {
            params.from = from;
        }

        if (to) {
            params.to = to;
        }

        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/#list-all-time-entries
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.harvestapp.com/v2/time_entries',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId
            },
            params
        });

        const timeEntries = data.time_entries || [];

        if (timeEntries.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: timeEntries, outputType });
    }
};

// Schema for a single time entry
const timeEntrySchema = {
    'id': { 'type': 'integer', 'title': 'Time Entry ID' },
    'spent_date': { 'type': 'string', 'title': 'Spent Date' },
    'user': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'integer', 'title': 'User ID' },
            'name': { 'type': 'string', 'title': 'User Name' }
        },
        'title': 'User'
    },
    'client': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'integer', 'title': 'Client ID' },
            'name': { 'type': 'string', 'title': 'Client Name' }
        },
        'title': 'Client'
    },
    'project': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'integer', 'title': 'Project ID' },
            'name': { 'type': 'string', 'title': 'Project Name' }
        },
        'title': 'Project'
    },
    'task': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'integer', 'title': 'Task ID' },
            'name': { 'type': 'string', 'title': 'Task Name' }
        },
        'title': 'Task'
    },
    'hours': { 'type': 'number', 'title': 'Hours' },
    'hours_without_timer': { 'type': 'number', 'title': 'Hours Without Timer' },
    'rounded_hours': { 'type': 'number', 'title': 'Rounded Hours' },
    'notes': { 'type': 'string', 'title': 'Notes' },
    'is_locked': { 'type': 'boolean', 'title': 'Is Locked' },
    'locked_reason': { 'type': 'string', 'title': 'Locked Reason' },
    'is_closed': { 'type': 'boolean', 'title': 'Is Closed' },
    'approval_status': { 'type': 'string', 'title': 'Approval Status' },
    'is_billed': { 'type': 'boolean', 'title': 'Is Billed' },
    'timer_started_at': { 'type': 'string', 'title': 'Timer Started At' },
    'started_time': { 'type': 'string', 'title': 'Started Time' },
    'ended_time': { 'type': 'string', 'title': 'Ended Time' },
    'is_running': { 'type': 'boolean', 'title': 'Is Running' },
    'billable': { 'type': 'boolean', 'title': 'Billable' },
    'budgeted': { 'type': 'boolean', 'title': 'Budgeted' },
    'billable_rate': { 'type': 'number', 'title': 'Billable Rate' },
    'cost_rate': { 'type': 'number', 'title': 'Cost Rate' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' }
};
