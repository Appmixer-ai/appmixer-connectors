'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { productId } = context.messages.in.content;

        if (!productId) {
            throw new context.CancelError('Product ID is required!');
        }

        // https://api.upsales.com/ - Products: GET /products/{id}
        const { data } = await lib.request(context, { path: '/products/' + encodeURIComponent(productId) });
        return context.sendJson(data.data, 'out');
    }
};
