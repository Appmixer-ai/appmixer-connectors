'use strict';

module.exports = {
    async receive(context) {

        const { subscriberId, email } = context.messages.in.content;

        if (!subscriberId && !email) {
            throw new context.CancelError('Either Subscriber ID or Email is required!');
        }

        let url;
        if (subscriberId) {
            url = `https://connect.mailerlite.com/api/subscribers/${subscriberId}`;
        } else {
            // When using email, we need to encode it for the URL
            const encodedEmail = encodeURIComponent(email);
            url = `https://connect.mailerlite.com/api/subscribers/${encodedEmail}`;
        }

        // https://developers.mailerlite.com/docs/subscribers.html#fetch-a-subscriber
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
