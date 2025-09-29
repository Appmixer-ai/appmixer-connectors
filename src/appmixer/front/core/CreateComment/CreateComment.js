'use strict';

module.exports = {
    async receive(context) {
        const { conversationId, body, author_id } = context.messages.in.content;

        if (!conversationId) {
            throw new context.CancelError('Conversation ID is required.');
        }

        if (!body) {
            throw new context.CancelError('Comment body is required.');
        }

        const requestData = { body };

        if (author_id) {
            requestData.author_id = author_id;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/conversations/${conversationId}/comments`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
