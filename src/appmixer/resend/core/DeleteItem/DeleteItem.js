'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.contents;

        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: 'https://api.resend.com/v1/items/' + id,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
