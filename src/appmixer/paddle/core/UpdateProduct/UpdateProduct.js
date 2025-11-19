/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { product_id, name, description, taxCategory, status, metadata } = context.messages.in.content;

        if (!product_id) {
            throw new context.CancelError('Product Id is required!');
        }

        // Build request body with only provided fields
        const data = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (taxCategory !== undefined) data.tax_category = taxCategory;
        if (status !== undefined) data.status = status;
        if (metadata !== undefined) data.metadata = metadata;

        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.paddle.com/products/${product_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data
        });

        return context.sendJson(response.data, 'out');
    }
};
