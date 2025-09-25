/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { from_type, from_id, body, subject, message_type } = context.messages.in.content;

        if (!from_type) {
            throw new context.CancelError('From Type is required!');
        }

        if (!from_id) {
            throw new context.CancelError('From ID is required!');
        }

        if (!body) {
            throw new context.CancelError('Message body is required!');
        }

        if (message_type === 'email' && !subject) {
            throw new context.CancelError('Subject is required when message type is email!');
        }

        const requestBody = {
            from: {
                type: from_type,
                id: from_id
            },
            body
        };

        if (message_type) {
            requestBody.message_type = message_type;
        }

        if (subject) {
            requestBody.subject = subject;
        }

        // https://developers.intercom.com/docs/references/rest-api/api.intercom.io/conversations/createconversation
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/conversations',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
