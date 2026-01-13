'use strict';

module.exports = {
    async receive(context) {

        const { documentId } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://www.googleapis.com/drive/v3/files/${documentId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
