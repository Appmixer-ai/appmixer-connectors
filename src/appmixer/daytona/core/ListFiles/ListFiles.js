'use strict';

const lib = require('../../lib');

const outputPortSchema = {
    'name': { 'type': 'string', 'title': 'File Name' },
    'path': { 'type': 'string', 'title': 'File Path' },
    'size': { 'type': 'integer', 'title': 'Size' },
    'type': { 'type': 'string', 'title': 'Type' },
    'modifiedAt': { 'type': 'string', 'title': 'Modified At' }
};

module.exports = {

    async receive(context) {

        const { sandboxId, path, outputType } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, outputPortSchema, { label: 'Files', value: 'files' });
        }

        const params = {};
        if (path) {
            params.path = path;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://app.daytona.io/api/sandbox/${sandboxId}/files/list`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            params
        });

        const files = (data.files || data || []).map(file => ({
            name: file.name,
            path: file.path,
            size: file.size,
            type: file.type || (file.is_dir ? 'directory' : 'file'),
            modifiedAt: file.modified_at || file.modifiedAt
        }));

        return lib.sendArrayOutput({ context, records: files, outputType });
    }
};
