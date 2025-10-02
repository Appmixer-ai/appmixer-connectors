'use strict';

module.exports = {
    async receive(context) {
        const { listId } = context.messages.in.content;
        if (!listId) {
            throw new context.CancelError('List ID is required');
        }


        // https://developers.brevo.com/reference/getlist-1
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.brevo.com/v3/contacts/lists/${listId}`,
            headers: {
                'api-key': `${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
