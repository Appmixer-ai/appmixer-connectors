/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    company_id: {
        type: 'string',
        title: 'Company Remote Id'
    },
    id: {
        type: 'string',
        title: 'Company Id'
    },
    app_id: {
        type: 'string',
        title: 'App Id'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    remote_created_at: {
        type: 'number',
        title: 'Remote Created At'
    },
    created_at: {
        type: 'number',
        title: 'Created At'
    },
    updated_at: {
        type: 'number',
        title: 'Updated At'
    },
    monthly_spend: {
        type: 'number',
        title: 'Monthly Spend'
    },
    session_count: {
        type: 'number',
        title: 'Session Count'
    },
    user_count: {
        type: 'number',
        title: 'User Count'
    },
    tags: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                title: 'Tags.Type'
            },
            tags: {
                type: 'array',
                items: {},
                title: 'Tags.Tags'
            }
        },
        title: 'Tags'
    },
    segments: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                title: 'Segments.Type'
            },
            segments: {
                type: 'array',
                items: {},
                title: 'Segments.Segments'
            }
        },
        title: 'Segments'
    },
    plan: {
        type: 'object',
        properties: {},
        title: 'Plan'
    },
    custom_attributes: {
        type: 'object',
        properties: {},
        title: 'Custom Attributes'
    }
};

module.exports = {

    async receive(context) {

        const { name, company_id, tag_id, segment_id, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Companies' });
        }

        const url = 'https://api.intercom.io/companies';
        const params = {};

        // Add query parameters if provided
        if (name) {
            params.name = name;
        }

        if (company_id) {
            params.company_id = company_id;
        }

        if (tag_id) {
            params.tag_id = tag_id;
        }

        if (segment_id) {
            params.segment_id = segment_id;
        }

        // https://developers.intercom.com/reference#list-all-companies
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            params
        });

        const records = data.data || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
