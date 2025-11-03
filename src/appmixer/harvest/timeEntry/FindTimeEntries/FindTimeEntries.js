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
    'id': { 'type': 'string', 'title': 'Time Entry ID' },
    'spent_date': { 'type': 'string', 'title': 'Spent Date' },
    'hours': { 'type': 'number', 'title': 'Hours' },
    'hours_without_timer': { 'type': 'number', 'title': 'Hours Without Timer' },
    'rounded_hours': { 'type': 'number', 'title': 'Rounded Hours' },
    'notes': { 'type': 'string', 'title': 'Notes' },
    'is_locked': { 'type': 'boolean', 'title': 'Is Locked' },
    'locked_reason': { 'type': 'string', 'title': 'Locked Reason' },
    'approval_status': { 'type': 'string', 'title': 'Approval Status' },
    'is_closed': { 'type': 'boolean', 'title': 'Is Closed' },
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
    'updated_at': { 'type': 'string', 'title': 'Updated At' },
    'user': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'number', 'title': 'User ID' },
            'name': { 'type': 'string', 'title': 'User Name' }
        },
        'title': 'User'
    },
    'client': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'number', 'title': 'Client ID' },
            'name': { 'type': 'string', 'title': 'Client Name' },
            'currency': { 'type': 'string', 'title': 'Client Currency' }
        },
        'title': 'Client'
    },
    'project': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'number', 'title': 'Project ID' },
            'name': { 'type': 'string', 'title': 'Project Name' },
            'code': { 'type': 'string', 'title': 'Project Code' }
        },
        'title': 'Project'
    },
    'task': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'number', 'title': 'Task ID' },
            'name': { 'type': 'string', 'title': 'Task Name' }
        },
        'title': 'Task'
    },
    'user_assignment': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'number', 'title': 'User Assignment ID' },
            'is_project_manager': { 'type': 'boolean', 'title': 'Is Project Manager' },
            'is_active': { 'type': 'boolean', 'title': 'Is Active' },
            'use_default_rates': { 'type': 'boolean', 'title': 'Use Default Rates' },
            'budget': { 'type': 'number', 'title': 'Budget' },
            'created_at': { 'type': 'string', 'title': 'Created At' },
            'updated_at': { 'type': 'string', 'title': 'Updated At' },
            'hourly_rate': { 'type': 'number', 'title': 'Hourly Rate' }
        },
        'title': 'User Assignment'
    },
    'task_assignment': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'number', 'title': 'Task Assignment ID' },
            'billable': { 'type': 'boolean', 'title': 'Billable' },
            'is_active': { 'type': 'boolean', 'title': 'Is Active' },
            'created_at': { 'type': 'string', 'title': 'Created At' },
            'updated_at': { 'type': 'string', 'title': 'Updated At' },
            'hourly_rate': { 'type': 'number', 'title': 'Hourly Rate' },
            'budget': { 'type': 'number', 'title': 'Budget' }
        },
        'title': 'Task Assignment'
    },
    'invoice': { 'type': 'object', 'title': 'Invoice' },
    'external_reference': { 'type': 'object', 'title': 'External Reference' }
};
