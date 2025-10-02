'use strict';

module.exports = {
    async receive(context) {
        const { folderId } = context.messages.in.content;
        if (!folderId) {
            throw new context.CancelError('Folder ID is required');
        }


        // https://developers.brevo.com/reference/getfolder-1
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.brevo.com/v3/contacts/folders/${folderId}`,
            headers: {
                'api-key': `${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
