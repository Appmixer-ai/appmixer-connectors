'use strict';

module.exports = {
    async receive(context) {
        const { name } = context.messages.in.content;
        if (!name) {
            throw new context.CancelError('Name is required');
        }


        // https://developers.brevo.com/reference/createfolder
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.brevo.com/v3/contacts/folders',
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: {
                name
            }
        });

        return context.sendJson(data, 'out');
    }
};
