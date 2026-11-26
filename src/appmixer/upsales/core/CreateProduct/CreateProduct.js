'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, listPrice, purchaseCost, articleNo, description, active } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const body = lib.compact({
            name,
            listPrice,
            purchaseCost,
            articleNo,
            description,
            active: active === false ? 0 : 1
        });

        // https://api.upsales.com/ - Products: POST /products
        const { data } = await lib.request(context, { method: 'POST', path: '/products', data: body });
        return context.sendJson(data.data, 'out');
    }
};
