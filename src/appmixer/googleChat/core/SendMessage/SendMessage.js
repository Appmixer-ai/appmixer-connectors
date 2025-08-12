
'use strict';

module.exports = {
    async receive(context) {

        const { space, text } = context.messages.in.content;

        if (!space) {
            throw new context.CancelError('Space is required.');
        }
        if (!text) {
            throw new context.CancelError('Text is required.');
        }

        const requestBody = {
            text: text
        };

        // Ensure space has the correct format
        const spaceId = space.startsWith('spaces/') ? space : `spaces/${space}`;

        // https://developers.google.com/workspace/chat/api/reference/rest/v1/spaces.messages/create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://chat.googleapis.com/v1/${spaceId}/messages`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        await context.log({ step: 'http-request-success', response: data });

        return context.sendJson(data, 'out');
    }
};
