'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Message ID is required.');
        }

        // https://dev.frontapp.com/reference/get-message
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/messages/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
