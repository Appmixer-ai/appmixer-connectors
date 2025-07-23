'use strict';

module.exports = {

    async receive(context) 
    {
        const { orderId } = context.messages.in.content;

        // Validate required fields
        if (!orderId) {
            throw new context.CancelError('Order ID is required');
        }

        // https://docs.lemonsqueezy.com/api/orders#generate-invoice
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.lemonsqueezy.com/v1/orders/${orderId}/generate-invoice`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        return context.sendJson({
            orderId: orderId,
            invoiceUrl: data?.meta?.urls?.download_invoice
        }, 'out');
    }
};
