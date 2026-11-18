'use strict';

const lib = require('../../lib');

// Output contract of one project. Exported because the `out` port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'workspace_id', 'name', 'active'],
    properties: {
        id: { type: 'integer', title: 'Project ID', example: 203456789 },
        workspace_id: { type: 'integer', title: 'Workspace ID', example: 1234567 },
        client_id: { type: 'integer', title: 'Client ID', example: 64123456 },
        name: { type: 'string', title: 'Name', example: 'Website Redesign' },
        active: { type: 'boolean', title: 'Active', example: true },
        is_private: { type: 'boolean', title: 'Private', example: true },
        billable: { type: 'boolean', title: 'Billable', example: false },
        color: { type: 'string', title: 'Color', example: '#06aaf5' },
        created_at: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-11-18T09:00:00+00:00' },
        at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-18T09:00:00+00:00' }
    }
};

// The largest page GET /workspaces/{workspace_id}/projects returns.
const PER_PAGE = 200;

const fetchProjects = async (context, workspaceId, cached) => {

    const url = `${lib.API_BASE_URL}/workspaces/${workspaceId}/projects`;
    // Active and archived projects.
    const params = { per_page: PER_PAGE, active: 'both' };
    const data = cached
        ? await lib.getCached(context, url, params)
        : (await lib.request(context, { method: 'GET', url, params })).data;
    return Array.isArray(data) ? data : [];
};

module.exports = {

    ITEM_SCHEMA,

    fetchProjects,

    async receive(context) {

        const { workspaceId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Projects' });
        }

        try {
            const resolvedWorkspaceId = await lib.resolveWorkspaceId(context, workspaceId);
            const projects = await fetchProjects(context, resolvedWorkspaceId, context.properties.isSource);
            const records = projects.map(project => ({
                id: project.id,
                workspace_id: project.workspace_id,
                client_id: project.client_id,
                name: project.name,
                active: project.active,
                is_private: project.is_private,
                billable: project.billable,
                color: project.color,
                created_at: project.created_at,
                at: project.at
            }));

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
