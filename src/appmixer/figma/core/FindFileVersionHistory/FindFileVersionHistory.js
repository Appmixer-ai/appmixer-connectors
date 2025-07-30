'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'label': { 'type': 'string', 'title': 'Label' },
    'description': { 'type': 'string', 'title': 'Description' },
    'user': {
        'type': 'object',
        'properties': {
            'handle': { 'type': 'string', 'title': 'User.Handle' }
        },
        'title': 'User'
    }
};

module.exports = {

    async receive(context) {

        const { fileId, outputType } = context.messages.in.content || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Versions' });
        }

        if (!fileId) {
            throw new context.CancelError('FileId is required');
        }

        // https://www.figma.com/developers/api#file-versions-get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.figma.com/v1/files/${fileId}/versions`,
            headers: {
                'Authorization': `Bearer ${context.auth?.accessToken}`
            }
        });

        const records = data?.versions || [];
        // Send to notFound port if no versions are found
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
