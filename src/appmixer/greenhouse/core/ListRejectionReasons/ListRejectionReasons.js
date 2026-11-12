'use strict';

const lib = require('../../lib');

// The output contract of ONE rejection reason. Exported because the out port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: {
            type: 'integer',
            title: 'Rejection Reason ID',
            example: 4001003
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Lacking skill(s)/qualification(s)'
        },
        type: {
            type: 'object',
            title: 'Type',
            properties: {
                id: {
                    type: 'integer',
                    title: 'Type.ID',
                    example: 1
                },
                key: {
                    type: 'string',
                    title: 'Type.Key',
                    example: 'WE_REJECTED_THEM'
                },
                name: {
                    type: 'string',
                    title: 'Type.Name',
                    example: 'We rejected them'
                }
            }
        },
        created_at: {
            type: 'string',
            format: 'date-time',
            title: 'Created At',
            example: '2026-01-05T10:00:00.000Z'
        },
        updated_at: {
            type: 'string',
            format: 'date-time',
            title: 'Updated At',
            example: '2026-01-05T10:00:00.000Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Rejection Reasons', value: 'result' });
        }

        const params = { include_defaults: true, per_page: lib.MAX_PAGE_SIZE };

        try {
            const records = context.properties.isSource
                ? await lib.listPageCached(context, '/v3/rejection_reasons', params)
                : (await lib.listPage(context, '/v3/rejection_reasons', params)).records;

            return await lib.sendArrayOutput({ context, outputType, records });
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
