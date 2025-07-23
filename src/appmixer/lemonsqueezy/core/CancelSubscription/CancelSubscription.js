'use strict';

module.exports = {

    async receive(context) 
    {
        const { subscriptionId, cancelImmediately } = context.messages.in;

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

        // If cancelImmediately is true, we also need to set ends_at to now
        if (cancelImmediately) {
            requestData.data.attributes.ends_at = new Date().toISOString();
        }

        // https://docs.lemonsqueezy.com/api/subscriptions#cancel-subscription
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `/subscriptions/${subscriptionId}`,
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
