'use strict';

module.exports = {

    async receive(context) {

        const { fileId, message } = context.messages?.in?.content || {};

        if (!fileId) {
            throw new context.CancelError('FileId is required');
        }

        if (!message) {
            throw new context.CancelError('Message is required');
        }

        // https://www.figma.com/developers/api#comments-post
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.figma.com/v1/files/${fileId}/comments`,
            headers: {
                'Authorization': `Bearer ${context.auth?.accessToken}`
            },
            data: {
                message: message
            }
        });

        return context.sendJson(data || {}, 'out');
    }
};
