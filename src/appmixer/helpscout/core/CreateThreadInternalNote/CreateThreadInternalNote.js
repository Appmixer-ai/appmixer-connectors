
'use strict';

module.exports = {

    async receive(context) {

        const { id, text, attachments } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Conversation ID is required');
        }
        if (!text) {
            throw new context.CancelError('Note text is required');
        }

        const requestData = {
            text: text,
            type: 'note'
        };

        // Add attachments if provided
        if (attachments) {
            requestData.attachments = [{ id: attachments }];
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.helpscout.net/v2/conversations/${id}/notes`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
