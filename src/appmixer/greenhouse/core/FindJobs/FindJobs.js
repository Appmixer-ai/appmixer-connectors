'use strict';

const lib = require('../../lib');

// The output contract of ONE job. Exported because the out port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'status', 'created_at', 'updated_at'],
    properties: {
        id: {
            type: 'integer',
            title: 'Job ID',
            example: 4433651003
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Senior Backend Engineer'
        },
        status: {
            type: 'string',
            title: 'Status',
            example: 'open'
        },
        requisition_id: {
            type: 'string',
            title: 'Requisition ID',
            example: 'REQ-1042'
        },
        confidential: {
            type: 'boolean',
            title: 'Confidential',
            example: false
        },
        is_template: {
            type: 'boolean',
            title: 'Is Template',
            example: false
        },
        copied_from_id: {
            type: 'integer',
            title: 'Copied From ID',
            example: 4433600003
        },
        notes: {
            type: 'string',
            title: 'Notes',
            example: '<p>Hiring for the payments team.</p>'
        },
        department_id: {
            type: 'integer',
            title: 'Department ID',
            example: 4012003
        },
        external_department_id: {
            type: 'string',
            title: 'External Department ID',
            example: 'ENG'
        },
        office_ids: {
            type: 'array',
            title: 'Office IDs',
            items: {
                type: 'integer'
            },
            example: [4033003]
        },
        external_office_ids: {
            type: 'array',
            title: 'External Office IDs',
            items: {
                type: 'string'
            },
            example: ['NYC']
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
        opened_at: {
            type: 'string',
            format: 'date-time',
            title: 'Opened At',
            example: '2026-10-01T12:00:00.000Z'
        },
        closed_at: {
            type: 'string',
            format: 'date-time',
            title: 'Closed At',
            example: '2026-12-01T12:00:00.000Z'
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
            example: '2026-11-10T14:22:05.000Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { status, requisitionId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Jobs', value: 'result' });
        }

        const params = { per_page: lib.MAX_PAGE_SIZE };
        if (status) {
            params.status = status;
        }
        if (requisitionId) {
            params.requisition_id = requisitionId;
        }

        try {
            const records = context.properties.isSource
                ? await lib.listPageCached(context, '/v3/jobs', params)
                : (await lib.listPage(context, '/v3/jobs', params)).records;

            if (!records.length) {
                return context.sendJson({}, 'notFound');
            }

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
        return items.map(item => ({ label: item.name + ' (' + item.status + ')', value: String(item.id) }));
    }
};
