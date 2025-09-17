/* eslint-disable camelcase */
'use strict';
module.exports = {

    async receive(context) {

        const { contact_id, admin_id, body } = context.messages.in.content;

        if (!contact_id) {
            throw new context.CancelError('Contact ID is required!');
        }

        if (!body) {
            throw new context.CancelError('Message body is required!');
        }

        const requestBody = {
            from: {
                type: 'contact',
                id: contact_id
            },
            body: body
        };

        if (admin_id) {
            requestBody.admin_id = admin_id;
        }

        // https://developers.intercom.com/reference#create-a-conversation
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
