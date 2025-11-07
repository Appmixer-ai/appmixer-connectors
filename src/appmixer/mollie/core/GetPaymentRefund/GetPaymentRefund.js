'use strict';

module.exports = {
    async receive(context) {

        const { paymentId, refundId } = context.messages.in.content;

        if (!paymentId) {
            throw new context.CancelError('Payment ID is required!');
        }

        if (!refundId) {
            throw new context.CancelError('Refund ID is required!');
        }

        // https://docs.mollie.com/reference/v2/refunds-api/get-payment-refund
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/payments/${paymentId}/refunds/${refundId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
