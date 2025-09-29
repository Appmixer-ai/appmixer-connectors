
'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            firstName,
            lastName,
            emailValue,
            emailType,
            background
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Customer ID is required!');
        }

        const requestBody = {};

        // Add fields to update if provided
        if (firstName) requestBody.firstName = firstName;
        if (lastName) requestBody.lastName = lastName;
        if (background) requestBody.background = background;

        if (emailValue) {
            requestBody.emails = [{
                value: emailValue,
                type: emailType || 'work'
            }];
        }

        // Only make request if there are fields to update
        if (Object.keys(requestBody).length === 0) {
            throw new context.CancelError('At least one field must be provided to update!');
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/customers/update/
        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://api.helpscout.net/v2/customers/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
