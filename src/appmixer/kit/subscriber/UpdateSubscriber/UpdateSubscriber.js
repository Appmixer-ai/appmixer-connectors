'use strict';

module.exports = {
    async receive(context) {

        const { subscriberId, firstName, email, customFields } = context.messages.in.content;

        // Validate required input
        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }

        const requestData = {
            email_address: email.trim(),
            first_name: firstName ? firstName.trim() : undefined,
            fields: customFields
        };

        // https://developers.kit.com/api-reference/subscribers/update-a-subscriber
        await context.httpRequest({
            method: 'PUT',
            url: `https://api.kit.com/v4/subscribers/${subscriberId}`,
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};

