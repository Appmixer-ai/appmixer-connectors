'use strict';

const lib = require('../../lib');

const outputPortSchema = {
    'id': { 'type': 'string', 'title': 'Sandbox ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'language': { 'type': 'string', 'title': 'Language' },
    'image': { 'type': 'string', 'title': 'Image' },
    'status': { 'type': 'string', 'title': 'Status' },
    'createdAt': { 'type': 'string', 'title': 'Created At' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, outputPortSchema, { label: 'Sandboxes', value: 'sandboxes' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.daytona.io/sandbox',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const sandboxes = (data.sandboxes || data || []).map(sandbox => ({
            id: sandbox.id,
            name: sandbox.name,
            language: sandbox.language,
            image: sandbox.image,
            status: sandbox.status,
            createdAt: sandbox.created_at || sandbox.createdAt
        }));

        return lib.sendArrayOutput({ context, records: sandboxes, outputType });
    }
};
