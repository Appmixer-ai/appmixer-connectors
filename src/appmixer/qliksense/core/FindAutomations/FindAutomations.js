'use strict';

const lib = require('../../lib');

// The output contract of ONE item (the out port is dynamic, so this is the only place it lives).
// Declared above module.exports: naming it there while the const sits below would throw.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: {
            type: 'string',
            title: 'Automation ID',
            example: '9d1e2f3a-4b5c-4d6e-8f7a-8b9c0d1e2f3a'
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Send sales report'
        },
        description: {
            type: 'string',
            title: 'Description',
            example: 'Mails the daily sales report.'
        },
        state: {
            type: 'string',
            title: 'State',
            example: 'available'
        },
        runMode: {
            type: 'string',
            title: 'Run Mode',
            example: 'manual'
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
            example: '2026-11-16T09:00:00.000Z',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            title: 'Updated At',
            example: '2026-11-16T09:30:00.000Z',
            format: 'date-time'
        },
        lastRunAt: {
            type: 'string',
            title: 'Last Run At',
            example: '2026-11-16T10:00:00.000Z',
            format: 'date-time'
        },
        lastRunStatus: {
            type: 'string',
            title: 'Last Run Status',
            example: 'finished'
        }
    }
};

// Automations list up to 200 per page.
const AUTOMATIONS_PAGE_SIZE = 200;

// A SCIM filter value: a JSON string, so quotes and backslashes are escaped.
const scimValue = (value) => JSON.stringify(String(value));

module.exports = {

    ITEM_SCHEMA,

    // Transform for the inspector dropdowns that use this component as a source.
    toSelectArray({ result = [] }) {

        return result.map(item => ({ label: item.name, value: item.id }));
    },

    async receive(context) {

        const { name, spaceId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Automations', value: 'result' });
        }

        const filters = [];
        if (name) {
            filters.push('name eq ' + scimValue(name));
        }
        if (spaceId) {
            filters.push('spaceId eq ' + scimValue(spaceId));
        }
        const params = { limit: AUTOMATIONS_PAGE_SIZE, sort: '-updatedAt' };
        if (filters.length) {
            params.filter = filters.join(' and ');
        }
        const fetch = async () => {
            const { data } = await lib.apiRequest(context, { path: '/api/workflows/automations', params });
            return ((data && data.data) || []).map(lib.mapAutomation);
        };

        if (context.properties.isSource) {
            try {
                const result = await lib.callCached(context, { source: 'automations', params }, fetch);
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
