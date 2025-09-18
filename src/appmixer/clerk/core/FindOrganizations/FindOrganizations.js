'use strict';

const lib = require('../../lib');

// Schema of a single organization item
const schema = {
    'id': {
        'type': 'string',
        'title': 'Organization ID'
    },
    'object': {
        'type': 'string',
        'title': 'Object'
    },
    'name': {
        'type': 'string',
        'title': 'Name'
    },
    'slug': {
        'type': 'string',
        'title': 'Slug'
    },
    'image_url': {
        'type': 'string',
        'title': 'Image URL'
    },
    'has_image': {
        'type': 'boolean',
        'title': 'Has Image'
    },
    'created_by': {
        'type': 'string',
        'title': 'Created By'
    },
    'created_at': {
        'type': 'number',
        'title': 'Created At'
    },
    'updated_at': {
        'type': 'number',
        'title': 'Updated At'
    },
    'public_metadata': {
        'type': 'object',
        'title': 'Public Metadata'
    },
    'private_metadata': {
        'type': 'object',
        'title': 'Private Metadata'
    },
    'max_allowed_memberships': {
        'type': 'number',
        'title': 'Max Allowed Memberships'
    },
    'admin_delete_enabled': {
        'type': 'boolean',
        'title': 'Admin Delete Enabled'
    },
    'members_count': {
        'type': 'number',
        'title': 'Members Count'
    }
};

module.exports = {

    async receive(context) {

        const { query, outputType = 'array' } = context.messages.in.content;

        // Generate output port schema dynamically based on the outputType
        // This is triggered by definition from the component.json, outPorts.out.source.url
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Organizations' });
        }

        // Make API request with optional query parameter
        const queryString = query ? `?query=${encodeURIComponent(query)}` : '';
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/organizations${queryString}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Extract organizations array from response
        const organizations = Array.isArray(data?.data) ? data?.data : [];

        if (organizations.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        // Use lib function to handle different output types
        return lib.sendArrayOutput({ context, records: organizations, outputType });
    }
};
