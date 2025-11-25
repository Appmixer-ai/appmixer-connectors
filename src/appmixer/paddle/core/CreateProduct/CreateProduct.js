'use strict';

module.exports = {
    async receive(context) {

        const { name, description, taxCategory, type, imageUrl, metadata } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        if (!taxCategory) {
            throw new context.CancelError('Tax Category is required!');
        }

        const requestData = {
            name: name,
            tax_category: taxCategory
        };

        if (description) {
            requestData.description = description;
        }

        if (type) {
            requestData.type = type;
        }

        if (imageUrl) {
            requestData.image_url = imageUrl;
        }

        if (metadata) {
            try {
                requestData.custom_data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (error) {
                throw new context.CancelError('Invalid JSON format in metadata field!');
            }
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.paddle.com/products',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestData
        });

        return context.sendJson(response.data.data, 'out');
    }
};
