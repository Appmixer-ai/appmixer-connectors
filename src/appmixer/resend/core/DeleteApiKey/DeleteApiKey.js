'use strict';

module.exports = {
    async receive(context) {

        const { key } = context.messages.in.content;

        if (!key) {
            throw new context.CancelError('API Key ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: 'https://api.resend.com/api-keys/' + key,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
