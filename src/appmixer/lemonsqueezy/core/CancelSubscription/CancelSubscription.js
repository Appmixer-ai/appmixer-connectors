'use strict';

module.exports = {

    async receive(context) {
        const { subscriptionId } = context.messages.in.content;
        // Validate required fields
        if (!subscriptionId) {
            throw new context.CancelError('Subscription ID is required');
        }

        let requestData = {
            data: {
                type: 'subscriptions',
                id: subscriptionId,
                attributes: {
                    cancelled: true
                }
            }
        };

        // https://docs.lemonsqueezy.com/api/subscriptions#cancel-subscription
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            data: requestData
        });

        return context.sendJson({
            id: data?.data?.id,
            storeId: data?.data?.attributes?.store_id,
            customerId: data?.data?.attributes?.customer_id,
            orderId: data?.data?.attributes?.order_id,
            productId: data?.data?.attributes?.product_id,
            variantId: data?.data?.attributes?.variant_id,
            status: data?.data?.attributes?.status,
            cancelled: data?.data?.attributes?.cancelled,
            createdAt: data?.data?.attributes?.created_at,
            updatedAt: data?.data?.attributes?.updated_at,
            endsAt: data?.data?.attributes?.ends_at,
            renewsAt: data?.data?.attributes?.renews_at
        }, 'out');
    }
};
