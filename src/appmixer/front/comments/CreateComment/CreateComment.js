'use strict';

module.exports = {
    async receive(context) {
        const { conversationId, body, authorId, isPinned } = context.messages.in.content;

        if (!conversationId) {
            throw new context.CancelError('Conversation ID is required.');
        }

        if (!body) {
            throw new context.CancelError('Comment body is required.');
        }

        const requestData = { body };

        if (authorId) {
            requestData.author_id = authorId;
        }

        if (isPinned !== undefined) {
            requestData.is_pinned = isPinned;
        }

        // https://dev.frontapp.com/reference/add-comment
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/conversations/${conversationId}/comments`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
