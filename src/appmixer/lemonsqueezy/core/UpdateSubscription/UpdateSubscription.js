'use strict';

module.exports = {

    async receive(context) 
    {
        const { subscriptionId, paused, billingAnchor, proration } = context.messages.in;

        // Validate required fields
        if (!subscriptionId) {
            throw new context.CancelError('Subscription ID is required');
        }

        const requestData = {
            data: {
                type: 'subscriptions',
                id: subscriptionId,
                attributes: {}
            }
        };

        if (typeof paused === 'boolean') {
            requestData.data.attributes.paused = paused;
        }

        if (billingAnchor) {
            requestData.data.attributes.billing_anchor = billingAnchor;
        }

        if (typeof proration === 'boolean') {
            requestData.data.attributes.proration = proration;
        }

        // https://docs.lemonsqueezy.com/api/subscriptions#update-subscription
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
            paused: data?.data?.attributes?.paused,
            billingAnchor: data?.data?.attributes?.billing_anchor,
            createdAt: data?.data?.attributes?.created_at,
            updatedAt: data?.data?.attributes?.updated_at,
            endsAt: data?.data?.attributes?.ends_at,
            renewsAt: data?.data?.attributes?.renews_at
        }, 'out');
    }
};
