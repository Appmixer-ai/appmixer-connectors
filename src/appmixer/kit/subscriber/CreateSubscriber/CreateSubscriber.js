'use strict';

module.exports = {
    async receive(context) {

        const { email, firstName, state, customFields } = context.messages.in.content;

        // Validate required inputs
        if (!email || !email.trim()) {
            throw new context.CancelError('Email is required!');
        }

        const requestData = {
            email_address: email.trim(),
            first_name: firstName ? firstName.trim() : undefined,
            state,
            fields: customFields
        };

        // https://developers.kit.com/api-reference/subscribers/create-a-subscriber
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.kit.com/v4/subscribers',
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            data: requestData
        });

        return context.sendJson(data.subscriber, 'out');
    }
};
