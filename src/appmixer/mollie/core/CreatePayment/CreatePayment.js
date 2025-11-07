'use strict';

module.exports = {
    async receive(context) {
        const { amount, currency, description, redirectUrl, webhookUrl, method, metadata, locale, sequenceType, customerId, mandateId, testmode } = context.messages.in.content;

        // Validate required inputs
        if (!amount) {
            throw new context.CancelError('Amount is required!');
        }
        if (!currency) {
            throw new context.CancelError('Currency is required!');
        }
        if (!description) {
            throw new context.CancelError('Description is required!');
        }

        // Build the payment request body
        const paymentData = {
            amount: {
                value: amount,
                currency: currency
            },
            description: description
        };

        // Add optional fields if provided
        if (redirectUrl) {
            paymentData.redirectUrl = redirectUrl;
        }
        if (webhookUrl) {
            paymentData.webhookUrl = webhookUrl;
        }
        if (method) {
            paymentData.method = method;
        }
        if (metadata) {
            paymentData.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        }
        if (locale) {
            paymentData.locale = locale;
        }
        if (sequenceType) {
            paymentData.sequenceType = sequenceType;
        }
        if (customerId) {
            paymentData.customerId = customerId;
        }
        if (mandateId) {
            paymentData.mandateId = mandateId;
        }
        if (testmode !== undefined && testmode !== null) {
            paymentData.testmode = testmode;
        }

        // https://docs.mollie.com/reference/v2/payments-api/create-payment
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.mollie.com/v2/payments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: paymentData
        });

        return context.sendJson(data, 'out');
    }
};
