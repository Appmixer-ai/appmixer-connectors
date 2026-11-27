'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            productId,
            name,
            listPrice,
            purchaseCost,
            articleNo,
            description,
            active
        } = context.messages.in.content;

        if (!productId) {
            throw new context.CancelError('Product ID is required!');
        }

        const body = lib.compact({
            name,
            listPrice,
            purchaseCost,
            articleNo,
            description,
            active: active === undefined || active === '' ? undefined : Number(active)
        });

        // https://api.upsales.com/ - Products: PUT /products/{id} (active: 0 disables it)
        await lib.request(context, { method: 'PUT', path: '/products/' + encodeURIComponent(productId), data: body });
        return context.sendJson({}, 'out');
    }
};
