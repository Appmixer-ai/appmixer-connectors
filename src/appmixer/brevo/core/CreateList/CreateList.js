'use strict';

module.exports = {
    async receive(context) {
        const { name, folderId } = context.messages.in.content;
        if (!name) {
            throw new context.CancelError('Name is required');
        }

        if (!folderId) {
            throw new context.CancelError('Folder ID is required');
        }


        // https://developers.brevo.com/reference/createlist-1
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.brevo.com/v3/contacts/lists',
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: {
                name, folderId: +folderId
            }
        });

        return context.sendJson(data, 'out');
    }
};
