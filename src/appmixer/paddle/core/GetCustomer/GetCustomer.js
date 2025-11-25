'use strict';

module.exports = {
    async receive(context) {

        const { customerId } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.paddle.com/customers/${customerId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data.data, 'out');
    }
};
