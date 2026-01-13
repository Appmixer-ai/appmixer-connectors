'use strict';

module.exports = {
    async receive(context) {

        const { paymentId } = context.messages.in.content;

        if (!paymentId) {
            throw new context.CancelError('Payment ID is required!');
        }

        // https://docs.mollie.com/reference/v2/payments-api/get-payment
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/payments/${paymentId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
