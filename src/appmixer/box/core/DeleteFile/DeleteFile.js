'use strict';

module.exports = {

    async receive(context) {

        const { fileId, ifMatch } = context.messages.in.content;

        if (!fileId) {
            throw new context.CancelError('File ID is required.');
        }

        const headers = {
            'Authorization': `Bearer ${context.auth.accessToken}`
        };

        if (ifMatch) {
            headers['If-Match'] = ifMatch;
        }

        // https://developer.box.com/reference/delete-files-id/
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.box.com/2.0/files/${fileId}`,
            headers
        });

        return context.sendJson({}, 'out');
    }
};
