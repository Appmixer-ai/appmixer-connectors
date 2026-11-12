'use strict';

const lib = require('../../lib');

// The output contract of ONE candidate. Exported because the out port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'created_at', 'updated_at'],
    properties: {
        id: {
            type: 'integer',
            title: 'Candidate ID',
            example: 41352870003
        },
        first_name: {
            type: 'string',
            title: 'First Name',
            example: 'Jane'
        },
        last_name: {
            type: 'string',
            title: 'Last Name',
            example: 'Doe'
        },
        preferred_name: {
            type: 'string',
            title: 'Preferred Name',
            example: 'Janie'
        },
        company: {
            type: 'string',
            title: 'Company',
            example: 'Acme Inc.'
        },
        title: {
            type: 'string',
            title: 'Title',
            example: 'Senior Backend Engineer'
        },
        private: {
            type: 'boolean',
            title: 'Private',
            example: false
        },
        can_email: {
            type: 'boolean',
            title: 'Can Email',
            example: true
        },
        time_zone: {
            type: 'string',
            title: 'Time Zone',
            example: 'Eastern Time (US & Canada)'
        },
        tags: {
            type: 'array',
            title: 'Tags',
            items: {
                type: 'string'
            },
            example: ['referral', 'backend']
        },
        linked_user_ids: {
            type: 'array',
            title: 'Linked User IDs',
            items: {
                type: 'integer'
            },
            example: [4080539003]
        },
        email_addresses: {
            type: 'array',
            title: 'Email Addresses',
            items: {
                type: 'object',
                properties: {
                    value: {
                        type: 'string',
                        title: 'Value',
                        example: 'jane.doe@example.com'
                    },
                    type: {
                        type: 'string',
                        title: 'Type',
                        example: 'personal'
                    }
                }
            },
            example: [
                {
                    value: 'jane.doe@example.com',
                    type: 'personal'
                }
            ]
        },
        phone_numbers: {
            type: 'array',
            title: 'Phone Numbers',
            items: {
                type: 'object',
                properties: {
                    value: {
                        type: 'string',
                        title: 'Value',
                        example: '+1 555 0100'
                    },
                    type: {
                        type: 'string',
                        title: 'Type',
                        example: 'mobile'
                    }
                }
            },
            example: [
                {
                    value: '+1 555 0100',
                    type: 'mobile'
                }
            ]
        },
        addresses: {
            type: 'array',
            title: 'Addresses',
            items: {
                type: 'object',
                properties: {
                    value: {
                        type: 'string',
                        title: 'Value',
                        example: '455 Broadway, New York, NY'
                    },
                    type: {
                        type: 'string',
                        title: 'Type',
                        example: 'home'
                    }
                }
            },
            example: [
                {
                    value: '455 Broadway, New York, NY',
                    type: 'home'
                }
            ]
        },
        website_addresses: {
            type: 'array',
            title: 'Website Addresses',
            items: {
                type: 'object',
                properties: {
                    value: {
                        type: 'string',
                        title: 'Value',
                        example: 'https://janedoe.dev'
                    },
                    type: {
                        type: 'string',
                        title: 'Type',
                        example: 'personal'
                    }
                }
            },
            example: [
                {
                    value: 'https://janedoe.dev',
                    type: 'personal'
                }
            ]
        },
        social_media_addresses: {
            type: 'array',
            title: 'Social Media Addresses',
            items: {
                type: 'object',
                properties: {
                    value: {
                        type: 'string',
                        title: 'Value',
                        example: 'linkedin.com/in/janedoe'
                    }
                }
            },
            example: [
                {
                    value: 'linkedin.com/in/janedoe'
                }
            ]
        },
        custom_fields: {
            type: 'object',
            title: 'Custom Fields',
            example: {
                desired_salary: {
                    name: 'Desired Salary',
                    type: 'short_text',
                    value: '120000'
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

        const { email, tag, createdAfter, updatedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Candidates', value: 'result' });
        }

        if (createdAfter && updatedAfter) {
            throw new context.CancelError('Use either Created After or Updated After, not both.');
        }

        const params = { per_page: lib.MAX_PAGE_SIZE };
        if (email) {
            params.email = email;
        }
        if (tag) {
            params.tag = tag;
        }
        const created = lib.dateFilter(context, 'gte', createdAfter, 'Created After');
        if (created) {
            params.created_at = created;
        }
        const updated = lib.dateFilter(context, 'gte', updatedAfter, 'Updated After');
        if (updated) {
            params.updated_at = updated;
        }

        const { records } = await lib.listPage(context, '/v3/candidates', params);

        if (!records.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
