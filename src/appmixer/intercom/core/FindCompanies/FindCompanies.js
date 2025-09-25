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

        const { tag_id, segment_id, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Companies' });
        }

        let url = 'https://api.intercom.io/companies';
        const queryParams = [];

        // Validate filter parameters - Intercom v2.14 API only accepts one filter at a time
        if (tag_id && segment_id) {
            // Both filters provided - log warning and use tag_id precedence
            await context.log({
                message: 'Both tag_id and segment_id provided. Using tag_id filter only as Intercom API v2.14 accepts only one filter parameter.'
            });
        }

        // Add query parameters with precedence: tag_id > segment_id
        // Only one filter parameter is allowed by Intercom v2.14 API
        if (tag_id) {
            queryParams.push(`tag_id=${encodeURIComponent(tag_id)}`);
        } else if (segment_id) {
            queryParams.push(`segment_id=${encodeURIComponent(segment_id)}`);
        }

        // Append query string if there are parameters
        if (queryParams.length > 0) {
            url += '?' + queryParams.join('&');
        }

        // https://developers.intercom.com/docs/references/rest-api/api.intercom.io/companies/retrievecompany
        const options = {
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            }
        };

        let data;
        try {
            ({ data } = await context.httpRequest(options));
        } catch (err) {
            if (err.response?.status === 404) {
                return context.sendJson({}, 'notFound');
            }
            throw err;
        }

        const records = data.data || [];
        return lib.sendArrayOutput({ context, records, outputType });

    }
};
