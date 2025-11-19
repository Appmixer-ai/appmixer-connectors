/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { transaction_id } = context.messages.in.content;

        if (!transaction_id) {
            throw new context.CancelError('Transaction Id is required!');
        }

        // https://developer.paddle.com/api-reference
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.paddle.com/transactions/${transaction_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
