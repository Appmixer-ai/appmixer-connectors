'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            clientId,
            isActive,
            updatedSince,
            outputType
        } = context.messages.in.content;

        // Generate output port schema dynamically based on outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, projectSchema, { label: 'Projects' });
        }

        const params = {};

        if (typeof isActive === 'boolean') {
            params.is_active = isActive;
        }

        if (clientId) {
            params.client_id = clientId;
        }

        if (updatedSince) {
            params.updated_since = updatedSince;
        }

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/#list-all-projects
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.harvestapp.com/v2/projects',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId
            },
            params
        });

        const projects = data.projects || [];

        if (projects.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: projects, outputType });
    }
};

// Schema for a single project
const projectSchema = {
    'id': { 'type': 'string', 'title': 'Project ID' },
    'name': { 'type': 'string', 'title': 'Project Name' },
    'code': { 'type': 'string', 'title': 'Project Code' },
    'is_active': { 'type': 'boolean', 'title': 'Is Active' },
    'is_billable': { 'type': 'boolean', 'title': 'Is Billable' },
    'is_fixed_fee': { 'type': 'boolean', 'title': 'Is Fixed Fee' },
    'bill_by': { 'type': 'string', 'title': 'Bill By' },
    'hourly_rate': { 'type': 'number', 'title': 'Hourly Rate' },
    'budget': { 'type': 'number', 'title': 'Budget' },
    'budget_by': { 'type': 'string', 'title': 'Budget By' },
    'budget_is_monthly': { 'type': 'boolean', 'title': 'Budget Is Monthly' },
    'notify_when_over_budget': { 'type': 'boolean', 'title': 'Notify When Over Budget' },
    'over_budget_notification_percentage': { 'type': 'number', 'title': 'Over Budget Notification Percentage' },
    'over_budget_notification_date': { 'type': 'string', 'title': 'Over Budget Notification Date' },
    'show_budget_to_all': { 'type': 'boolean', 'title': 'Show Budget To All' },
    'cost_budget': { 'type': 'number', 'title': 'Cost Budget' },
    'cost_budget_include_expenses': { 'type': 'boolean', 'title': 'Cost Budget Include Expenses' },
    'fee': { 'type': 'number', 'title': 'Fee' },
    'notes': { 'type': 'string', 'title': 'Notes' },
    'starts_on': { 'type': 'string', 'title': 'Start Date' },
    'ends_on': { 'type': 'string', 'title': 'End Date' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' },
    'client': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'integer', 'title': 'Client ID' },
            'name': { 'type': 'string', 'title': 'Client Name' }
        },
        'title': 'Client'
    }
};
