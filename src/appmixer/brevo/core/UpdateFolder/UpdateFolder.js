'use strict';

module.exports = {
    async receive(context) {
        const { folderId, name } = context.messages.in.content;
        if (!folderId) {
            throw new context.CancelError('Folder ID is required');
        }

        if (!name) {
            throw new context.CancelError('Name is required');
        }


        // https://developers.brevo.com/reference/updatefolder-1
        await context.httpRequest({
            method: 'PUT',
            url: `https://api.brevo.com/v3/contacts/folders/${folderId}`,
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: {
                name
            }
        });

        return context.sendJson({ id: folderId }, 'out');
    }
};
