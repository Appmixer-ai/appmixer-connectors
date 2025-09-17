/* eslint-disable camelcase */
'use strict';
module.exports = {

    async receive(context) {

        const { id, admin_id, body } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Conversation ID is required!');
        }

        if (!body) {
            throw new context.CancelError('Message body is required!');
        }

        const requestBody = {
            type: 'admin',
            body: body
        };

        if (admin_id) {
            requestBody.admin_id = admin_id;
        }

        // https://developers.intercom.com/reference#reply-to-a-conversation
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.intercom.io/conversations/${id}/reply`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
