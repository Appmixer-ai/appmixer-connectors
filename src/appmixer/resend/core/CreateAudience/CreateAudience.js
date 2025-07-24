'use strict';

module.exports = {

    async receive(context) {

        const { name } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Audience name is required!');
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/audiences',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                name
            }
        });

        return context.sendJson(data, 'out');
    }
};
