/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const {
            product_id,
            name,
            description,
            type,
            tax_category: taxCategory,
            image_url,
            metadata,
            status
        } = context.messages.in.content;

        if (!product_id) {
            throw new context.CancelError('Product Id is required!');
        }

        // Build request body with only provided fields
        const data = {};
        if (name !== undefined && name !== '') data.name = name;
        if (description !== undefined && description !== '') data.description = description;
        if (type !== undefined && type !== '') data.type = type;
        if (taxCategory !== undefined && taxCategory !== '') data.tax_category = taxCategory;
        if (image_url !== undefined && image_url !== '') data.image_url = image_url;
        if (metadata !== undefined && metadata !== '') {
            try {
                data.custom_data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (error) {
                throw new context.CancelError('Invalid JSON format in metadata field!');
            }
        }
        if (status !== undefined && status !== '') data.status = status;

        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.paddle.com/products/${product_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data
        });

        return context.sendJson(response.data.data, 'out');
    }
};
