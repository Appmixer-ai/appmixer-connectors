'use strict';

module.exports = {
    async receive(context) {

        const { documentId, metadata, async } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        let metadataObj = metadata;
        if (typeof metadata === 'string') {
            try {
                metadataObj = JSON.parse(metadata);
            } catch (e) {
                throw new context.CancelError('Metadata must be valid JSON!');
            }
        }

        const params = {};
        if (async === true) {
            params.async = true;
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.ragie.ai/documents/${documentId}/metadata`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                metadata: metadataObj
            },
            params
        });

        return context.sendJson({}, 'out');
    }
};
