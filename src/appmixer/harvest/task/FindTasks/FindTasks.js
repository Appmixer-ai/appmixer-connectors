'use strict';

const lib = require('../../lib');

// Schema for a single task
const taskSchema = {
    'id': { 'type': 'string', 'title': 'Task ID' },
    'name': { 'type': 'string', 'title': 'Task Name' },
    'billable_by_default': { 'type': 'boolean', 'title': 'Billable By Default' },
    'is_default': { 'type': 'boolean', 'title': 'Is Default' },
    'is_active': { 'type': 'boolean', 'title': 'Is Active' },
    'created_at': { 'type': 'string', 'format': 'date-time', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'format': 'date-time', 'title': 'Updated At' },
    'default_hourly_rate': { 'type': 'number', 'title': 'Default Hourly Rate' }
};

module.exports = {

    async receive(context) {

        const {
            isActive,
            updatedSince,
            outputType
        } = context.messages.in.content;

        // Generate output port schema dynamically based on outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, taskSchema, { label: 'Tasks' });
        }

        const params = {
            per_page: 2000
        };

        if (typeof isActive === 'boolean') {
            params.is_active = isActive;
        }

        if (updatedSince) {
            params.updated_since = updatedSince;
        }

        // https://help.getharvest.com/api-v2/tasks-api/tasks/tasks/#list-all-tasks
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.harvestapp.com/v2/tasks',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId
            },
            params
        });

        const tasks = data.tasks || [];

        if (tasks.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: tasks, outputType });
    }
};
