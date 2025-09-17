'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { id, email, name, custom_attributes } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Contact ID is required!');
        }

        const requestBody = {};

        if (email) {
            requestBody.email = email;
        }

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

        // https://developers.intercom.com/reference#update-a-contact
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.intercom.io/contacts/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};