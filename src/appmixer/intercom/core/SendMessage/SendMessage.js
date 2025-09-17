/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { recipient_id, message_type, body } = context.messages.in.content;

        if (!recipient_id) {
            throw new context.CancelError('Recipient ID is required!');
        }

        if (!message_type) {
            throw new context.CancelError('Message type is required!');
        }

        if (!body) {
            throw new context.CancelError('Message body is required!');
        }

        const requestBody = {
            message_type: message_type,
            body: body,
            to: {
                type: 'user',
                id: recipient_id
            }
        };

        // https://developers.intercom.com/reference#send-a-message
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/messages',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
