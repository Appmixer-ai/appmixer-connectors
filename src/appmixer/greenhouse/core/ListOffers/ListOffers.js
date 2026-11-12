'use strict';

const lib = require('../../lib');

// The output contract of ONE offer. Exported because the out port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'version', 'application_id', 'candidate_id', 'job_id', 'status', 'created_at', 'updated_at'],
    properties: {
        id: {
            type: 'integer',
            title: 'Offer ID',
            example: 3921144003
        },
        version: {
            type: 'integer',
            title: 'Version',
            example: 2
        },
        application_id: {
            type: 'integer',
            title: 'Application ID',
            example: 57193664003
        },
        candidate_id: {
            type: 'integer',
            title: 'Candidate ID',
            example: 41352870003
        },
        job_id: {
            type: 'integer',
            title: 'Job ID',
            example: 4433651003
        },
        opening_id: {
            type: 'integer',
            title: 'Opening ID',
            example: 5120443003
        },
        status: {
            type: 'string',
            title: 'Status',
            example: 'Accepted'
        },
        starts_on: {
            type: 'string',
            format: 'date',
            title: 'Starts On',
            example: '2027-01-04'
        },
        sent_on: {
            type: 'string',
            format: 'date',
            title: 'Sent On',
            example: '2026-11-20'
        },
        resolved_at: {
            type: 'string',
            format: 'date-time',
            title: 'Resolved At',
            example: '2026-11-22T16:30:00.000Z'
        },
        custom_fields: {
            type: 'object',
            title: 'Custom Fields',
            example: {
                employment_type: {
                    name: 'Employment Type',
                    type: 'single_select',
                    value: 'Full-time'
                }
            }
        },
        created_at: {
            type: 'string',
            format: 'date-time',
            title: 'Created At',
            example: '2026-11-18T10:00:00.000Z'
        },
        updated_at: {
            type: 'string',
            format: 'date-time',
            title: 'Updated At',
            example: '2026-11-22T16:30:00.000Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Offers', value: 'result' });
        }

        const params = { current_only: true, per_page: lib.MAX_PAGE_SIZE };

        try {
            const records = context.properties.isSource
                ? await lib.listPageCached(context, '/v3/offers', params)
                : (await lib.listPage(context, '/v3/offers', params)).records;

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
        return items.map(item => ({ label: String(item.id) + ' (' + item.status + ')', value: String(item.id) }));
    }
};
