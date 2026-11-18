'use strict';

const lib = require('../../lib');

// Output contract of one project. Exported because the `out` port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'workspace_id', 'name'],
    properties: {
        id: { type: 'integer', title: 'Project ID', example: 5302177 },
        workspace_id: { type: 'integer', title: 'Workspace ID', example: 21808213 },
        client_id: { type: 'integer', title: 'Client ID', example: 953805 },
        name: { type: 'string', title: 'Name', example: 'Website Redesign' },
        description: { type: 'string', title: 'Description', example: 'Redesign of the marketing site' },
        private: { type: 'boolean', title: 'Private', example: false },
        billable: { type: 'boolean', title: 'Billable', example: false },
        color: { type: 'string', title: 'Color', example: '#06aaf5' },
        archived_at: { type: 'string', format: 'date-time', title: 'Archived At', example: '2026-11-18T09:00:00.084772Z' },
        completed_at: { type: 'string', format: 'date-time', title: 'Completed At', example: '2026-11-18T09:00:00.084772Z' },
        created_at: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-11-18T09:00:00.084772Z' },
        updated_at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-18T09:00:00.084772Z' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Projects' });
        }

        try {
            const records = await lib.fetchProjects(context, { cached: context.properties.isSource });
            return lib.sendArrayOutput({ context, outputType, records });
        } catch (err) {
            if (context.properties.isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }
    },

    toSelectArray(msg) {

        const items = (msg && msg.result) || [];
        return items.map(item => ({ label: item.name, value: String(item.id) }));
    }
};
