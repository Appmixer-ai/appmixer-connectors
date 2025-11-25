/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { product_id } = context.messages.in.content;

        if (!product_id) {
            throw new context.CancelError('Product Id is required!');
        }

        // https://developer.paddle.com/api-reference
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.paddle.com/products/${product_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data.data, 'out');
    }
};
