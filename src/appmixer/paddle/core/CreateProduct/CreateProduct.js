'use strict';

module.exports = {
    async receive(context) {

        const { name, description, taxCategory, metadata } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const requestData = {
            name: name
        };

        if (description) {
            requestData.description = description;
        }

        if (taxCategory) {
            requestData.tax_category = taxCategory;
        }

        if (metadata) {
            requestData.metadata = metadata;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.paddle.com/products',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestData
        });

        return context.sendJson(response.data, 'out');
    }
};
