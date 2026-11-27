'use strict';

const lib = require('../../lib');

// The output contract of ONE item (the out port is dynamic, so this is the only place it lives).
// Declared above module.exports: naming it there while the const sits below would throw.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'itemId', 'name', 'resourceType', 'createdAt', 'updatedAt'],
    properties: {
        id: {
            type: 'string',
            title: 'App ID',
            example: 'f34b2a1e-5c7d-4e8f-9a0b-1c2d3e4f5a6b'
        },
        itemId: {
            type: 'string',
            title: 'Item ID',
            example: '6372a4bd1cbd1e3c1e21ab43'
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Sales Dashboard'
        },
        description: {
            type: 'string',
            title: 'Description',
            example: 'Quarterly sales by region.'
        },
        resourceType: {
            type: 'string',
            title: 'Resource Type',
            example: 'app'
        },
        spaceId: {
            type: 'string',
            title: 'Space ID',
            example: '62716f4b39b865ece543cd45'
        },
        ownerId: {
            type: 'string',
            title: 'Owner ID',
            example: '5f8a1c2b3d4e5f6a7b8c9d0e'
        },
        createdAt: {
            type: 'string',
            title: 'Created At',
            example: '2026-11-16T09:12:44.512Z',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            title: 'Updated At',
            example: '2026-11-16T10:02:11.003Z',
            format: 'date-time'
        },
        lastReloadStatus: {
            type: 'string',
            title: 'Last Reload Status',
            example: 'ok'
        },
        lastReloadEndTime: {
            type: 'string',
            title: 'Last Reload End Time',
            example: '2026-11-16T10:01:58.940Z',
            format: 'date-time'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // Transform for the inspector dropdowns that use this component as a source.
    toSelectArray({ result = [] }) {

        return result.map(item => ({ label: item.name, value: item.id }));
    },

    async receive(context) {

        const { query, spaceId, ownerId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Apps', value: 'result' });
        }

        const params = { resourceType: 'app', sort: '-createdAt', limit: lib.PAGE_SIZE, noActions: true };
        if (query) {
            params.query = query;
        }
        if (spaceId) {
            params.spaceId = spaceId;
        }
        if (ownerId) {
            params.ownerId = ownerId;
        }
        const fetch = async () => {
            const { data } = await lib.apiRequest(context, { path: '/api/v1/items', params });
            return ((data && data.data) || []).map(lib.mapAppItem);
        };

        if (context.properties.isSource) {
            try {
                const result = await lib.callCached(context, { source: 'apps', params }, fetch);
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
