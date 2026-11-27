'use strict';

const lib = require('../../lib');

// The output contract of ONE item (the out port is dynamic, so this is the only place it lives).
// Declared above module.exports: naming it there while the const sits below would throw.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'tenantId'],
    properties: {
        id: {
            type: 'string',
            title: 'Space ID',
            example: '62716f4b39b865ece543cd45'
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Finance'
        },
        type: {
            type: 'string',
            title: 'Type',
            example: 'shared'
        },
        description: {
            type: 'string',
            title: 'Description',
            example: 'Shared analytics for the finance team.'
        },
        ownerId: {
            type: 'string',
            title: 'Owner ID',
            example: '5f8a1c2b3d4e5f6a7b8c9d0e'
        },
        tenantId: {
            type: 'string',
            title: 'Tenant ID',
            example: 'xqGQ0k66vSR8f9G7J-vYtHZQkiYrCpct'
        },
        createdAt: {
            type: 'string',
            title: 'Created At',
            example: '2026-11-16T09:00:00.000Z',
            format: 'date-time'
        },
        createdBy: {
            type: 'string',
            title: 'Created By',
            example: '5f8a1c2b3d4e5f6a7b8c9d0e'
        },
        updatedAt: {
            type: 'string',
            title: 'Updated At',
            example: '2026-11-16T09:30:00.000Z',
            format: 'date-time'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // Transform for the inspector dropdowns that use this component as a source.
    toSelectArray({ result = [] }) {

        return result.map(item => ({ label: item.name + ' (' + item.type + ')', value: item.id }));
    },

    async receive(context) {

        const { name, type, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Spaces', value: 'result' });
        }

        const params = { sort: '+name', limit: lib.PAGE_SIZE };
        if (name) {
            params.name = name;
        }
        if (type) {
            params.type = type;
        }
        const fetch = async () => {
            const { data } = await lib.apiRequest(context, { path: '/api/v1/spaces', params });
            return ((data && data.data) || []).map(lib.mapSpace);
        };

        if (context.properties.isSource) {
            try {
                const result = await lib.callCached(context, { source: 'spaces', params }, fetch);
                return context.sendJson({ result, count: result.length }, 'out');
            } catch (err) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
        }

        const records = await fetch();
        if (!records.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records });
    }
};
