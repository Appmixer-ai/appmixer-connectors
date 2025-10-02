'use strict';

module.exports = {
    async receive(context) {
        const { commentId } = context.messages.in.content;

        if (!commentId) {
            throw new context.CancelError('Comment ID is required.');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/comments/${commentId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
