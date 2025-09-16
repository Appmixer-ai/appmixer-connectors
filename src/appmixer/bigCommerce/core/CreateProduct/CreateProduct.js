/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { name, type, price, weight, sku, description, is_visible } = context.messages.in.content;

        // Required fields validation
        if (!name) {
            throw new context.CancelError('Product name is required!');
        }
        if (!type) {
            throw new context.CancelError('Product type is required!');
        }
        if (price === undefined || price === null) {
            throw new context.CancelError('Product price is required!');
        }
        if (weight === undefined || weight === null) {
            throw new context.CancelError('Product weight is required!');
        }

        // Validate name length (max 250 characters)
        if (name.length > 250) {
            throw new context.CancelError('Product name must be 250 characters or less!');
        }

        // Validate price and weight are non-negative
        if (price < 0) {
            throw new context.CancelError('Product price must be 0 or greater!');
        }
        if (weight < 0) {
            throw new context.CancelError('Product weight must be 0 or greater!');
        }

        // Build product data
        const productData = {
            name,
            type,
            price,
            weight
        };

        // Add optional fields
        if (sku) {
            productData.sku = sku;
        }
        if (description) {
            productData.description = description;
        }
        if (is_visible !== undefined) {
            productData.is_visible = is_visible;
        } else {
            // Default to true if not specified
            productData.is_visible = true;
        }

        // Build include_fields array based on the fields we're providing
        const includeFields = ['name', 'type', 'price', 'weight', 'is_visible'];
        if (sku) {
            includeFields.push('sku');
        }
        if (description) {
            includeFields.push('description');
        }

        // https://developer.bigcommerce.com/api-reference/store-management/catalog/products/createproduct
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/products`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            params: {
                include_fields: includeFields.join(',')
            },
            data: productData
        });

        return context.sendJson(data.data, 'out');
    }
};
