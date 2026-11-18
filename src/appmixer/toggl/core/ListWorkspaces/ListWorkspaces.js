'use strict';

const lib = require('../../lib');

// Output contract of one workspace. Exported because the `out` port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'integer', title: 'Workspace ID', example: 1234567 },
        name: { type: 'string', title: 'Name', example: 'Acme Workspace' },
        organization_id: { type: 'integer', title: 'Organization ID', example: 7654321 },
        premium: { type: 'boolean', title: 'Premium', example: false },
        admin: { type: 'boolean', title: 'Admin', example: true },
        role: { type: 'string', title: 'Role', example: 'admin' },
        default_currency: { type: 'string', title: 'Default Currency', example: 'USD' },
        at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-18T09:00:00+00:00' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Workspaces' });
        }

        const url = `${lib.API_BASE_URL}/me/workspaces`;
        try {
            const data = context.properties.isSource
                ? await lib.getCached(context, url)
                : (await lib.request(context, { method: 'GET', url })).data;
            const records = (Array.isArray(data) ? data : []).map(workspace => ({
                id: workspace.id,
                name: workspace.name,
                organization_id: workspace.organization_id,
                premium: workspace.premium,
                admin: workspace.admin,
                role: workspace.role,
                default_currency: workspace.default_currency,
                at: workspace.at
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
