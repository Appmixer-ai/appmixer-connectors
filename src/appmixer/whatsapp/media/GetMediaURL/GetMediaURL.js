'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { mediaId } = context.messages.in.content;

        if (!mediaId) {
            throw new context.CancelError('Media ID is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'GET',
            path: `/${mediaId}`
        });

        return context.sendJson({
            url: data.url,
            mimeType: data.mime_type,
            sha256: data.sha256,
            fileSize: data.file_size,
            messagingProduct: data.messaging_product
        }, 'out');
    }
};
