'use strict';

const lib = require('../../lib');

// Schema for a single task
const taskSchema = {
    'id': { 'type': 'integer', 'title': 'Task ID' },
    'name': { 'type': 'string', 'title': 'Task Name' },
    'is_active': { 'type': 'boolean', 'title': 'Is Active' },
    'billable_by_default': { 'type': 'boolean', 'title': 'Billable By Default' },
    'is_default': { 'type': 'boolean', 'title': 'Is Default' },
    'default_hourly_rate': { 'type': ['number', 'null'], 'title': 'Default Hourly Rate' },
    'created_at': { 'type': 'string', 'format': 'date-time', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'format': 'date-time', 'title': 'Updated At' }
};

module.exports = {

    async receive(context) {
        const {
            isActive,
            updatedSince,
            outputType
        } = context.messages.in.content;

        context.log({ step: 'auth', auth: context.auth });

        // Generate output port schema dynamically based on outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, taskSchema, { label: 'Tasks' });
        }

        const params = {};

        if (typeof isActive === 'boolean') {
            params.is_active = isActive;
        }

        if (updatedSince) {
            params.updated_since = updatedSince;
        }

        // https://help.getharvest.com/api-v2/tasks-api/tasks/tasks/#list-all-tasks
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.harvestapp.com/v2/tasks',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (auth@appmixer.ai)',
                'Harvest-Account-ID': context.auth.accountId
            },
            params
        });

        const tasks = response.data.tasks || [];

        if (tasks.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: tasks, outputType });
    }
};
