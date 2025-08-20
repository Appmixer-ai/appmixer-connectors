'use strict';

const lib = require('../../lib.generated');

// Updated schema based on actual API response
const schema = {
    'url': { 'type': 'string', 'title': 'Model URL' },
    'owner': { 'type': 'string', 'title': 'Model Owner' },
    'name': { 'type': 'string', 'title': 'Model Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'visibility': { 'type': 'string', 'title': 'Visibility' },
    'github_url': { 'type': 'string', 'title': 'GitHub URL' },
    'paper_url': { 'type': 'string', 'title': 'Paper URL' },
    'license_url': { 'type': 'string', 'title': 'License URL' },
    'cover_image_url': { 'type': 'string', 'title': 'Cover Image URL' },
    'default_example': { 'type': 'object', 'title': 'Default Example' },
    'latest_version': {
        'type': 'object',
        'title': 'Latest Version',
        'properties': {
            'id': { 'type': 'string', 'title': 'Latest Version.ID' },
            'created_at': { 'type': 'string', 'title': 'Latest Version.Created At' },
            'cog_version': { 'type': 'string', 'title': 'Latest Version.Cog Version' },
            'openapi_schema': { 'type': 'object', 'title': 'Latest Version.OpenAPI Schema' }
        }
    }
};

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;

        // Generate output port schema dynamically based on the outputType
        // This is triggered by definition from the component.json outPorts.out.source
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Models' });
        }

        let url = 'https://api.replicate.com/v1/models';

        let requestConfig = {
            method: 'GET',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        };

        // https://replicate.com/docs/reference/http#models.list
        const { data } = await context.httpRequest(requestConfig);

        const records = data.results || data || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
