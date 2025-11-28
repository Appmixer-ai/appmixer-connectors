/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {
        const { customer_id, price_id, quantity, currency_code } = context.messages.in.content;

        // Validate required inputs
        if (!customer_id) {
            throw new context.CancelError('Customer ID is required!');
        }

        if (!price_id) {
            throw new context.CancelError('Price ID is required!');
        }

        // Build request body
        const requestData = {
            customer_id,
            items: [
                {
                    price_id,
                    quantity: quantity || 1
                }
            ]
        };

        if (currency_code) {
            requestData.currency_code = currency_code;
        }

        // https://developer.paddle.com/api-reference/transactions/create-transaction
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.paddle.com/transactions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestData
        });

        return context.sendJson(response.data, 'out');
    }
};
