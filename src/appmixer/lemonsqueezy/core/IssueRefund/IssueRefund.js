'use strict';

module.exports = {

    async receive(context) 
    {
        const { orderId, amount, reason } = context.messages.in;

        // Validate required fields
        if (!orderId) {
            throw new context.CancelError('Order ID is required');
        }

        const requestData = {
            data: {
                type: 'order-refunds',
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
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `/orders/${orderId}/refunds`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            data: requestData
        });

        return context.sendJson({
            id: data?.data?.id,
            orderId: orderId,
            amount: data?.data?.attributes?.amount,
            currency: data?.data?.attributes?.currency,
            status: data?.data?.attributes?.status,
            reason: data?.data?.attributes?.reason,
            createdAt: data?.data?.attributes?.created_at,
            updatedAt: data?.data?.attributes?.updated_at
        }, 'out');
    }
};
