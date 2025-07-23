'use strict';

module.exports = {

    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Domain ID is required.');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: 'https://api.resend.com/domains/' + id,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
