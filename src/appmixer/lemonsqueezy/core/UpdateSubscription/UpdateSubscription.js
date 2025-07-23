'use strict';

module.exports = {

    async receive(context) {
        const {
            subscriptionId,
            variantId,
            pauseMode,
            pauseResumesAt,
            cancelled,
            trialEndsAt,
            billingAnchor,
            invoiceImmediately,
            disableProrations
        } = context.messages.in.content;

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

        // Add variant_id if provided
        if (variantId) {
            requestData.data.attributes.variant_id = variantId;
        }

        // Handle pause logic
        if (pauseMode) {
            if (pauseMode === 'unpause') {
                // Set pause to null to unpause the subscription
                requestData.data.attributes.pause = null;
            } else {
                // Set pause object for void or free modes
                requestData.data.attributes.pause = {
                    mode: pauseMode
                };
                // Add resumes_at only if provided (it's optional)
                if (pauseResumesAt) {
                    requestData.data.attributes.pause.resumes_at = pauseResumesAt;
                }
            }
        }

        // Add cancelled if provided
        if (typeof cancelled === 'boolean') {
            requestData.data.attributes.cancelled = cancelled;
        }

        // Add trial_ends_at if provided
        if (trialEndsAt) {
            requestData.data.attributes.trial_ends_at = trialEndsAt;
        }

        // Add billing_anchor if provided
        if (billingAnchor) {
            requestData.data.attributes.billing_anchor = billingAnchor;
        }

        // Add invoice_immediately if provided
        if (typeof invoiceImmediately === 'boolean') {
            requestData.data.attributes.invoice_immediately = invoiceImmediately;
        }

        // Add disable_prorations if provided
        if (typeof disableProrations === 'boolean') {
            requestData.data.attributes.disable_prorations = disableProrations;
        }

        // https://docs.lemonsqueezy.com/api/subscriptions#update-subscription
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
            pause: data?.data?.attributes?.pause,
            cancelled: data?.data?.attributes?.cancelled,
            trialEndsAt: data?.data?.attributes?.trial_ends_at,
            billingAnchor: data?.data?.attributes?.billing_anchor,
            createdAt: data?.data?.attributes?.created_at,
            updatedAt: data?.data?.attributes?.updated_at,
            endsAt: data?.data?.attributes?.ends_at,
            renewsAt: data?.data?.attributes?.renews_at
        }, 'out');
    }
};
