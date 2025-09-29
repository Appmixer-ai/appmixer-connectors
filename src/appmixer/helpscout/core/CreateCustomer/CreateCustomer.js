
'use strict';

module.exports = {
    async receive(context) {

        const { firstName, lastName, photoUrl, emailValue, emailType, background } = context.messages.in.content;

        if (!firstName) {
            throw new context.CancelError('First Name is required.');
        }
        if (!emailValue) {
            throw new context.CancelError('Email is required.');
        }

        const requestData = {
            firstName,
            lastName,
            photoUrl,
            background
        };

        // Add email if provided
        if (emailValue) {
            requestData.emails = [{
                value: emailValue,
                type: emailType || 'work'
            }];
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/customers/create/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.helpscout.net/v2/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
