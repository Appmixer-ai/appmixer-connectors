'use strict';

module.exports = {

    async receive(context) {

        const { folderId, recursive, ifMatch } = context.messages.in.content;

        if (!folderId) {
            throw new context.CancelError('Folder ID is required!');
        }

        const params = {};
        if (recursive !== undefined) {
            params.recursive = recursive;
        }

        const headers = {
            'Authorization': `Bearer ${context.auth.accessToken}`
        };

        if (ifMatch) {
            headers['If-Match'] = ifMatch;
        }

        // https://developer.box.com/reference/delete-folders-id/
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.box.com/2.0/folders/${folderId}`,
            headers,
            params
        });

        return context.sendJson({}, 'out');
    }
};
