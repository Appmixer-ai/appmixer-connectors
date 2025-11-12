'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Chunk ID' },
    'document_id': { 'type': 'string', 'title': 'Document ID' },
    'text': { 'type': 'string', 'title': 'Text' },
    'metadata': { 'type': 'object', 'title': 'Metadata' },
    'score': { 'type': 'number', 'title': 'Score' }
};

module.exports = {

    async receive(context) {

        const { documentId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Chunks', value: 'chunks' });
        }

        const params = {
            page_size: 100
        };

        if (documentId) {
            params.document_id = documentId;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.ragie.ai/chunks',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            },
            params
        });

        const chunks = data.chunks || [];

        if (chunks.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: chunks, outputType });
    }
};
