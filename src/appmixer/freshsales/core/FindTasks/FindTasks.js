'use strict';

const lib = require('../../lib');

const outputPortItemSchema = {
    id: { type: 'integer', title: 'ID' },
    title: { type: 'string', title: 'Title' },
    description: { type: ['string', 'null'], title: 'Description' },
    due_date: { type: ['string', 'null'], title: 'Due Date' },
    status: { type: 'integer', title: 'Status' },
    owner_id: { type: ['integer', 'null'], title: 'Owner ID' },
    created_at: { type: 'string', title: 'Created At' },
    updated_at: { type: 'string', title: 'Updated At' },
    completed_date: { type: ['string', 'null'], title: 'Completed Date' },
    creater_id: { type: ['integer', 'null'], title: 'Creator ID' },
    updater_id: { type: ['integer', 'null'], title: 'Updater ID' },
    outcome_id: { type: ['integer', 'null'], title: 'Outcome ID' },
    task_type_id: { type: ['integer', 'null'], title: 'Task Type ID' },
    is_linkedin_type: { type: 'boolean', title: 'Is LinkedIn Type' },
    targetables: { type: 'array', title: 'Targetables' },
    targetables_with_email: { type: 'array', title: 'Targetables With Email' },
    has_multiple_emails: { type: 'boolean', title: 'Has Multiple Emails' },
    user_ids: { type: 'array', title: 'User IDs' },
    targetable: { type: ['object', 'null'], title: 'Targetable' }
};

module.exports = {

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                context.messages.in.content.outputType,
                outputPortItemSchema,
                { label: 'Tasks', value: 'tasks' }
            );
        }

        const { filter, owner_id: ownerId, outputType } = context.messages.in.content;

        const params = new URLSearchParams();
        if (filter) params.set('filter', filter);
        if (ownerId) params.set('owner_id', ownerId);

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/tasks?${params}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const tasks = data?.tasks || data || [];

        if (tasks.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({
            context,
            outputPortName: 'out',
            outputType: outputType || 'array',
            records: tasks
        });
    }
};
