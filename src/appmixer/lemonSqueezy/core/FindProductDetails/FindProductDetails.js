
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) 
    {
        const { id } = context.messages.in.content;

        // Validate required fields
        if (!id) {
            throw new context.CancelError('Product ID is required');
        }

        // https://docs.lemonsqueezy.com/api/products#get-product
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/products/{id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
