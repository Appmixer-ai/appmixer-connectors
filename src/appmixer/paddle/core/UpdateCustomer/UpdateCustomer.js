'use strict';

module.exports = {
    async receive(context) {
        const {
            customerId,
            email,
            name,
            locale,
            status,
            metadata
        } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }

        // Build request body with only provided fields
        const requestData = {};

        if (email !== undefined) {
            requestData.email = email;
        }

        if (name !== undefined) {
            requestData.name = name;
        }

        if (locale !== undefined) {
            requestData.locale = locale;
        }

        if (status !== undefined) {
            requestData.status = status;
        }

        if (metadata) {
            try {
                requestData.custom_data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (error) {
                throw new context.CancelError('Invalid JSON format in metadata field!');
            }
        }

        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.paddle.com/customers/${customerId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestData
        });

        return context.sendJson(data.data, 'out');
    }
};
