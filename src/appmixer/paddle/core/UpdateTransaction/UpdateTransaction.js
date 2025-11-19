/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {
        const { transaction_id, metadata, status } = context.messages.in.content;

        if (!transaction_id) {
            throw new context.CancelError('Transaction ID is required!');
        }

        const updateData = {};

        if (metadata) {
            updateData.metadata = metadata;
        }

        if (status) {
            updateData.status = status;
        }

        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.paddle.com/transactions/${transaction_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: updateData
        });

        return context.sendJson(data, 'out');
    }
};
