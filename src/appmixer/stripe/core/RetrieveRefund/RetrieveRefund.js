'use strict';

module.exports = {
    async receive(context) {

        const { refundId } = context.messages.in.content;

        if (!refundId) {
            throw new context.CancelError('Refund ID is required!');
        }

        // https://stripe.com/docs/api/refunds/retrieve
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.stripe.com/v1/refunds/${refundId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return context.sendJson(data, 'out');
    }
};
