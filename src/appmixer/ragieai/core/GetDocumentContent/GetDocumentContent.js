'use strict';

module.exports = {
    async receive(context) {

        const { documentId, mediaType, download } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document Id is required!');
        }

        // https://docs.ragie.ai/reference/getdocumentcontent
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

        // Determine if we're requesting binary/stream content
        const isBinaryRequest = mediaType && mediaType !== 'application/json';

        if (isBinaryRequest) {
            requestOptions.encoding = 'binary';
            const { data } = await context.httpRequest(requestOptions);
            const filename = `document-${documentId}-content`;
            const file = await context.saveFileStream(filename, data);
            return context.sendJson({ fileId: file.fileId }, 'out');
        }

        const { data } = await context.httpRequest(requestOptions);

        return context.sendJson(data, 'out');
    }
};
