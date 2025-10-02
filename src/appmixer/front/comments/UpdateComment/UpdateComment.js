'use strict';

module.exports = {
    async receive(context) {
        const { commentId, body, is_pinned } = context.messages.in.content;

        if (!commentId) {
            throw new context.CancelError('Comment ID is required.');
        }

        const requestData = {};

        if (body !== undefined) {
            requestData.body = body;
        }

        if (is_pinned !== undefined) {
            requestData.is_pinned = is_pinned;
        }

        // If no data to update, throw an error
        if (Object.keys(requestData).length === 0) {
            throw new context.CancelError('At least one field (body or is_pinned) must be provided for update.');
        }

        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/comments/${commentId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
