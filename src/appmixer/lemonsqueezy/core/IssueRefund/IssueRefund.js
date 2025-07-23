'use strict';

module.exports = {

    async receive(context) {
        const { orderId, amount, reason } = context.messages.in.content;

        // Validate required fields
        if (!orderId) {
            throw new context.CancelError('Order ID is required');
        }

        const requestData = {
            data: {
                type: 'orders',
                id: orderId,
                attributes: {}
            }
        };

        if (amount) {
            requestData.data.attributes.amount = amount;
        }

        if (reason) {
            requestData.data.attributes.reason = reason;
        }

        // https://docs.lemonsqueezy.com/api/order-refunds#create-order-refund
        const options = {
            method: 'POST',
            url: `https://api.lemonsqueezy.com/v1/orders/${orderId}/refund`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            data: requestData
        };

        const { data } = await context.httpRequest(options);

        return context.sendJson(data, 'out');
    }
};
