/* eslint-disable camelcase */

'use strict';

module.exports = {

    async receive(context) {

        const { email, name, custom_attributes } = context.messages.in.content;

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const requestBody = {
            email: email
        };

        if (name) {
            requestBody.name = name;
        }

        if (custom_attributes) {
            try {
                requestBody.custom_attributes = typeof custom_attributes === 'string'
                    ? JSON.parse(custom_attributes)
                    : custom_attributes;
            } catch (error) {
                throw new context.CancelError('Invalid custom attributes format. Must be valid JSON.');
            }
        }

        // https://developers.intercom.com/reference#create-a-contact
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
