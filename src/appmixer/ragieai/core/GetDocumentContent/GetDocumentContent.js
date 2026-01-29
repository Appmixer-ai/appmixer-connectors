'use strict';

module.exports = {
    async receive(context) {

        const { document_id, media_type, download } = context.messages.in.content;

        if (!document_id) {
            throw new context.CancelError('Document Id is required!');
        }

        const requestOptions = {
            method: 'GET',
            url: `https://api.ragie.ai/documents/${document_id}/content`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: {}
        };

        if (media_type) {
            requestOptions.headers['Accept'] = media_type;
        }

        if (download) {
            requestOptions.params.download = 'true';
        }

        const { data } = await context.httpRequest(requestOptions);

        return context.sendJson(data, 'out');
    }
};
