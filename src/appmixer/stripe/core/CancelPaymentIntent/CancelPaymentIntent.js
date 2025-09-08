'use strict';

module.exports = {
    async receive(context) {

        const id = context.messages.in.content.payment_intent_id;

        if (!id) {
            throw new context.CancelError('Payment Intent ID is required!');
        }

        // https://stripe.com/docs/api/payment_intents/cancel
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.stripe.com/v1/payment_intents/${id}/cancel`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return context.sendJson(data, 'out');
    }
};
