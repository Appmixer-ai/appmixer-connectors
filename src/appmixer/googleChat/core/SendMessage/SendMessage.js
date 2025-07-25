
'use strict';

module.exports = {
    async receive(context) {

        const { space, text, threadKey } = context.messages.in.content;

        if (!space) {
            throw new context.CancelError('Space is required.');
        }
        if (!text) {
            throw new context.CancelError('Text is required.');
        }

        const requestBody = {
            text: text
        };

        if (threadKey) {
            requestBody.threadKey = threadKey;
        }

        // https://developers.google.com/workspace/chat/api/reference/rest/v1/spaces.messages/create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://chat.googleapis.com/v1/spaces/${space}/messages`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
