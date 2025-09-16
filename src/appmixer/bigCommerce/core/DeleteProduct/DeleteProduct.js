/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { product_id } = context.messages.in.content;

        if (!product_id) {
            throw new context.CancelError('Product ID is required!');
        }

        // https://developer.bigcommerce.com/api-reference/store-management/catalog/products/deleteproduct
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/products/${product_id}`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            }
        });

        return context.sendJson({}, 'out');
    }
};
