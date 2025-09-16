/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { product_id, name, price, is_visible } = context.messages.in.content;

        if (!product_id) {
            throw new context.CancelError('Product ID is required!');
        }

        // Build update data - only include fields that are provided
        const updateData = {};
        if (name !== undefined) {
            updateData.name = name;
        }
        if (price !== undefined) {
            updateData.price = price;
        }
        if (is_visible !== undefined) {
            updateData.is_visible = is_visible;
        }

        // https://developer.bigcommerce.com/api-reference/store-management/catalog/products/updateproduct
        await context.httpRequest({
            method: 'PUT',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/products/${product_id}`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            data: updateData
        });

        return context.sendJson({}, 'out');
    }
};
