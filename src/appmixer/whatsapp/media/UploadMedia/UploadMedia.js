'use strict';

const FormData = require('form-data');
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { fileId, mimeType } = context.messages.in.content;

        if (!fileId) {
            throw new context.CancelError('File is required!');
        }
        if (!mimeType) {
            throw new context.CancelError('MIME Type is required!');
        }

        const phoneNumberId = context.auth && context.auth.phoneNumberId;
        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is missing. Set it in the auth account.');
        }

        const fileInfo = await context.getFileInfo(fileId);
        const stream = await context.getFileReadStream(fileId);

        const form = new FormData();
        form.append('messaging_product', 'whatsapp');
        form.append('type', mimeType);
        form.append('file', stream, {
            filename: fileInfo.filename || 'upload',
            contentType: mimeType,
            knownLength: fileInfo.size
        });

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${lib.BASE_URL}/${phoneNumberId}/media`,
            data: form,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                ...form.getHeaders()
            }
        });

        return context.sendJson({ mediaId: data.id }, 'out');
    }
};
