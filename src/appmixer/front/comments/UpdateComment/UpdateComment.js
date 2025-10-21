'use strict';

module.exports = {
    async receive(context) {
        const { commentId, body, isPinned } = context.messages.in.content;

        if (!commentId) {
            throw new context.CancelError('Comment ID is required.');
        }

        const requestData = {};

        if (body) {
            requestData.body = body;
        }

        if (isPinned !== undefined) {
            requestData.is_pinned = isPinned;
        }

        // https://dev.frontapp.com/reference/update-comment
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/comments/${commentId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};
