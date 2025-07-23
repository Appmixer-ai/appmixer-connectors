
'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.content;

        // Validate required fields
        if (!id) {
            throw new context.CancelError('Order ID is required');
        }

        // https://docs.lemonsqueezy.com/api/orders#get-order
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.lemonsqueezy.com/v1/orders/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data.data, 'out');
    }
};
