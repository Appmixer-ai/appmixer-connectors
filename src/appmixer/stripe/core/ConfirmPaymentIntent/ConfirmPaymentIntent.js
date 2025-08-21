'use strict';

module.exports = {
    async receive(context) {

        const { payment_intent_id: id, payment_method: paymentMethod, returnUrl } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Payment Intent ID is required');
        }
        // https://stripe.com/docs/api/payment_intents/confirm
        const requestData = {};
        if (paymentMethod) {
            requestData.payment_method = paymentMethod;
        }
        if (returnUrl) {
            requestData.return_url = returnUrl;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.stripe.com/v1/payment_intents/${id}/confirm`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
