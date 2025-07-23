'use strict';

module.exports = {

    async receive(context) 
    {
        const { orderId } = context.messages.in;

        // Validate required fields
        if (!orderId) {
            throw new context.CancelError('Order ID is required');
        }

        // https://docs.lemonsqueezy.com/api/orders#generate-invoice
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `/orders/${orderId}/generate-invoice`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        return context.sendJson({
            orderId: orderId,
            invoiceUrl: data?.data?.attributes?.urls?.invoice_url,
            invoiceNumber: data?.data?.attributes?.number,
            status: data?.data?.attributes?.status,
            createdAt: data?.data?.attributes?.created_at,
            updatedAt: data?.data?.attributes?.updated_at
        }, 'out');
    }
};
