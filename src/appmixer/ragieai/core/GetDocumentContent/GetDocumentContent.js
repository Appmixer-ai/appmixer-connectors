'use strict';

module.exports = {
    async receive(context) {

        const { documentId, mediaType, download } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document Id is required!');
        }

        const requestOptions = {
            method: 'GET',
            url: `https://api.ragie.ai/documents/${documentId}/content`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: {}
        };

        if (mediaType) {
            requestOptions.headers['Accept'] = mediaType;
        }

        if (download) {
            requestOptions.params.download = 'true';
        }

        const { data } = await context.httpRequest(requestOptions);

        return context.sendJson(data, 'out');
    }
};
