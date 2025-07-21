
'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Missing required input: id');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/users/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
