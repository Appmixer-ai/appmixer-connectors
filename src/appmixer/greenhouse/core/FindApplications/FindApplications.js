'use strict';

const lib = require('../../lib');

// The output contract of ONE application. Exported because the out port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'candidate_id', 'status', 'prospect', 'created_at', 'updated_at'],
    properties: {
        id: {
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
        job_post_id: {
            type: 'integer',
            title: 'Job Post ID',
            example: 4521987003
        },
        status: {
            type: 'string',
            title: 'Status',
            example: 'in_process'
        },
        prospect: {
            type: 'boolean',
            title: 'Prospect',
            example: false
        },
        stage_id: {
            type: 'integer',
            title: 'Stage ID',
            example: 92010443003
        },
        job_interview_stage_id: {
            type: 'integer',
            title: 'Job Interview Stage ID',
            example: 3299451003
        },
        stage_name: {
            type: 'string',
            title: 'Stage Name',
            example: 'Phone Interview'
        },
        needs_decision: {
            type: 'boolean',
            title: 'Needs Decision',
            example: false
        },
        rejected_at: {
            type: 'string',
            format: 'date-time',
            title: 'Rejected At',
            example: '2026-11-11T08:00:00.000Z'
        },
        rejection_reason_id: {
            type: 'integer',
            title: 'Rejection Reason ID',
            example: 4001003
        },
        source_id: {
            type: 'integer',
            title: 'Source ID',
            example: 7003
        },
        recruiter_id: {
            type: 'integer',
            title: 'Recruiter ID',
            example: 4080539003
        },
        coordinator_id: {
            type: 'integer',
            title: 'Coordinator ID',
            example: 4080540003
        },
        referrer_id: {
            type: 'integer',
            title: 'Referrer ID',
            example: 1203003
        },
        agency_note_id: {
            type: 'integer',
            title: 'Agency Note ID',
            example: 88201003
        },
        location_address: {
            type: 'string',
            title: 'Location Address',
            example: '455 Broadway, New York, NY'
        },
        prospective_job_ids: {
            type: 'array',
            title: 'Prospective Job IDs',
            items: {
                type: 'integer'
            },
            example: [4433651003]
        },
        answers: {
            type: 'array',
            title: 'Answers',
            items: {
                type: 'object',
                properties: {
                    question: {
                        type: 'string',
                        title: 'Question',
                        example: 'Are you authorized to work in the US?'
                    },
                    answer: {
                        type: 'string',
                        title: 'Answer',
                        example: 'Yes'
                    }
                }
            },
            example: [
                {
                    question: 'Are you authorized to work in the US?',
                    answer: 'Yes'
                }
            ]
        },
        custom_fields: {
            type: 'object',
            title: 'Custom Fields',
            example: {
                priority: {
                    name: 'Priority',
                    type: 'single_select',
                    value: 'High'
                }
            }
        },
        last_activity_at: {
            type: 'string',
            format: 'date-time',
            title: 'Last Activity At',
            example: '2026-11-10T14:22:05.000Z'
        },
        created_at: {
            type: 'string',
            format: 'date-time',
            title: 'Created At',
            example: '2026-11-02T09:15:30.000Z'
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

        const { candidateId, jobId, status, updatedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Applications', value: 'result' });
        }

        const params = { per_page: lib.MAX_PAGE_SIZE };
        const candidate = lib.toId(context, candidateId, 'Candidate ID');
        if (candidate) {
            params.candidate_ids = candidate;
        }
        const job = lib.toId(context, jobId, 'Job');
        if (job) {
            params.job_ids = job;
        }
        if (status) {
            params.status = status;
        }
        const updated = lib.dateFilter(context, 'gte', updatedAfter, 'Updated After');
        if (updated) {
            params.updated_at = updated;
        }

        const { records } = await lib.listPage(context, '/v3/applications', params);

        if (!records.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
