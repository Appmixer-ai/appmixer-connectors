'use strict';

const lib = require('../../lib');

// The output contract of ONE interview stage. Exported because the out port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'job_id', 'name', 'sort_order', 'active'],
    properties: {
        id: {
            type: 'integer',
            title: 'Stage ID',
            example: 3299451003
        },
        job_id: {
            type: 'integer',
            title: 'Job ID',
            example: 4433651003
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Phone Interview'
        },
        sort_order: {
            type: 'integer',
            title: 'Sort Order',
            example: 1
        },
        active: {
            type: 'boolean',
            title: 'Active',
            example: true
        },
        dwell_time_days: {
            type: 'integer',
            title: 'Dwell Time Days',
            example: 5
        },
        created_at: {
            type: 'string',
            format: 'date-time',
            title: 'Created At',
            example: '2026-09-28T10:00:00.000Z'
        },
        updated_at: {
            type: 'string',
            format: 'date-time',
            title: 'Updated At',
            example: '2026-09-28T10:00:00.000Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { jobId: rawJobId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Stages', value: 'result' });
        }

        if (!rawJobId) {
            if (context.properties.isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw new context.CancelError('Job is required!');
        }
        const jobId = lib.toId(context, rawJobId, 'Job');
        const params = { job_ids: jobId, per_page: lib.MAX_PAGE_SIZE };

        try {
            const records = context.properties.isSource
                ? await lib.listPageCached(context, '/v3/job_interview_stages', params)
                : (await lib.listPage(context, '/v3/job_interview_stages', params)).records;
            // Stages in the order of the interview plan.
            records.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

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
