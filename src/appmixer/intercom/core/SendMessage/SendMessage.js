'use strict';

const lib = require('../../lib.generated');

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
            from: {
                type: 'admin',
                id: recipient_id
            }
        };

        // https://developers.intercom.com/reference#create-a-message
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/messages',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};