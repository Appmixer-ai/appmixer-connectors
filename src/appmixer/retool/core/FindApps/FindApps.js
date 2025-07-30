
'use strict';

const lib = require('../../lib.generated');

// Schema of the single app item
const schema = {
    'id': { 'type': 'string', 'title': 'App ID' },
    'name': { 'type': 'string', 'title': 'App Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'appType': { 'type': 'string', 'title': 'App Type' },
    'isPublic': { 'type': 'boolean', 'title': 'Is Public' },
    'ownerId': { 'type': 'string', 'title': 'Owner ID' },
    'folderId': { 'type': 'string', 'title': 'Folder ID' }
};

module.exports = {
    async receive(context) {

        const { search, outputType = 'array' } = context.messages.in.content;
        const { baseUrl, apiToken } = context.auth;

        // Generate output port schema dynamically based on the outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Apps', value: 'result' });
        }

        const cleanBaseUrl = baseUrl.replace(/\/$/, '');

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${cleanBaseUrl}/api/v1/apps`,
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        let apps = data.data || data || [];

        // Apply search filter if provided
        if (search) {
            const searchLower = search.toLowerCase();
            apps = apps.filter(app => 
                (app.name && app.name.toLowerCase().includes(searchLower)) ||
                (app.description && app.description.toLowerCase().includes(searchLower))
            );
        }

        if (apps.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        // Modify the output based on the outputType
        return lib.sendArrayOutput({ context, records: apps, outputType });
    }
};

