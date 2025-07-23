'use strict';

module.exports = {

    async receive(context) {
        const { orderId, name, address, city, state, zipCode, country } = context.messages.in.content;

        // Validate required fields
        if (!orderId) {
            throw new context.CancelError('Order ID is required');
        }
        if (!name) {
            throw new context.CancelError('Customer name is required');
        }
        if (!address) {
            throw new context.CancelError('Address is required');
        }
        if (!city) {
            throw new context.CancelError('City is required');
        }
        if (!state) {
            throw new context.CancelError('State is required');
        }
        if (!zipCode) {
            throw new context.CancelError('ZIP code is required');
        }
        if (!country) {
            throw new context.CancelError('Country is required');
        }

        const requestData = {
            data: {
                type: 'orders',
                id: orderId,
                attributes: {
                    billing_address: {
                        name: name,
                        address: address,
                        city: city,
                        state: state,
                        zip_code: zipCode,
                        country: country
                    }
                }
            }
        };

        // https://docs.lemonsqueezy.com/api/orders#generate-invoice
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.lemonsqueezy.com/v1/orders/${orderId}/generate-invoice`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            data: requestData
        });

        return context.sendJson({
            orderId: orderId,
            invoiceUrl: data?.meta?.urls?.download_invoice
        }, 'out');
    }
};
