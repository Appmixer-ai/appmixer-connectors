'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Tag ID is required.');
        }

        // https://dev.frontapp.com/reference/get-tag
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/tags/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
