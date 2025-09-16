/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { product_id } = context.messages.in.content;

        // Product ID is required
        if (!product_id) {
            throw new context.CancelError('Product ID is required!');
        }

        // https://developer.bigcommerce.com/api-reference/store-management/catalog/products/getproductbyid
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/products/${product_id}`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            params: {
                // Include useful sub-resources for optimal data richness
                include: 'bulk_pricing_rules,custom_fields,options,modifiers'
            }
        });
        return context.sendJson(data.data, 'out');
    }
};
