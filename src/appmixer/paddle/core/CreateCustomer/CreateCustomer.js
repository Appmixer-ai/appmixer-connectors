'use strict';

module.exports = {
    async receive(context) {
        const {
            email,
            name,
            locale,
            metadata
        } = context.messages.in.content;

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const requestBody = {
            email
        };

        if (name) {
            requestBody.name = name;
        }

        if (locale) {
            requestBody.locale = locale;
        }

        if (metadata) {
            try {
                requestBody.custom_data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (error) {
                throw new context.CancelError('Invalid JSON format in metadata field!');
            }
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.paddle.com/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(response.data.data, 'out');
    }
};
