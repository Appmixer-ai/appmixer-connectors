
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { subscriber_id, email } = context.messages.in.content;

        if (!subscriber_id && !email) {
            throw new context.CancelError('Either Subscriber ID or Email is required!');
        }

        let url;
        if (subscriber_id) {
            url = `https://connect.mailerlite.com/api/subscribers/${subscriber_id}`;
        } else {
            // When using email, we need to encode it for the URL
            const encodedEmail = encodeURIComponent(email);
            url = `https://connect.mailerlite.com/api/subscribers/${encodedEmail}`;
        }

        // https://developers.mailerlite.com/docs/#subscribers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data.data, 'out');
    }
};
