'use strict';

module.exports = {
    async receive(context) {
        const {
            paymentId,
            amount_value: amountValue,
            amount_currency: amountCurrency,
            description,
            metadata
        } = context.messages.in.content;

        if (!paymentId) {
            throw new context.CancelError('Payment ID is required!');
        }

        // Build the refund data object
        const requestData = {};

        // Add amount if provided
        if (amountValue || amountCurrency) {
            requestData.amount = {};
            if (amountValue) {
                requestData.amount.value = amountValue;
            }
            if (amountCurrency) {
                requestData.amount.currency = amountCurrency;
            }
        }

        // Add optional fields
        if (description) {
            requestData.description = description;
        }

        if (metadata) {
            requestData.metadata = metadata;
        }

        // https://docs.mollie.com/reference/v2/refunds-api/create-refund
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.mollie.com/v2/payments/${paymentId}/refunds`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
