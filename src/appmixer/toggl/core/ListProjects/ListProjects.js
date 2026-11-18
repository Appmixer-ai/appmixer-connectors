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

const toProject = project => lib.withoutNulls({
    id: project.id,
    workspace_id: project.workspace_id,
    client_id: project.client_id,
    name: project.name,
    description: project.description,
    private: project.private,
    billable: project.billable,
    color: project.color,
    archived_at: project.archived_at,
    completed_at: project.completed_at,
    created_at: project.created_at,
    updated_at: project.updated_at
});

/**
 * Projects of the workspace, archived and completed ones included (an empty `archived` and
 * `completed` parameter means "all"; omitting them hides archived and completed projects).
 */
const fetchProjects = async (context, { cached = false, orderBy = 'name', maxPages } = {}) => {

    const { workspace } = await lib.urls(context);
    const url = `${workspace}/projects`;
    const params = { archived: '', completed: '', order_by: orderBy };
    const projects = cached
        ? await lib.listAllCached(context, url, params)
        : await lib.listAll(context, url, params, { maxPages });
    return projects.map(toProject);
};

module.exports = {

    ITEM_SCHEMA,

    fetchProjects,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Projects' });
        }

        try {
            const records = await fetchProjects(context, { cached: context.properties.isSource });
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
