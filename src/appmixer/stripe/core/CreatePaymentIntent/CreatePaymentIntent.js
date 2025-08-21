'use strict';

module.exports = {
    async receive(context) {

        const {
            amount,
            currency,
            paymentMethod,
            description,
            customer,
            paymentMethodTypes,
            automaticPaymentMethodsEnabled,
            automaticPaymentMethodsAllowRedirects
        } = context.messages.in.content;

        if (!amount) {
            throw new context.CancelError('Amount is required');
        }
        if (!currency) {
            throw new context.CancelError('Currency is required');
        }

        // Build the request data
        const requestData = {
            amount: amount,
            currency: currency
        };

        // Add optional fields if provided
        if (paymentMethod) requestData.payment_method = paymentMethod;
        if (description) requestData.description = description;
        if (customer) requestData.customer = customer;
        if (paymentMethodTypes) {
            // Handle comma-separated string or array
            const types = Array.isArray(paymentMethodTypes)
                ? paymentMethodTypes
                : paymentMethodTypes.split(',').map(type => type.trim());
            requestData.payment_method_types = types;
        }

        // Handle automatic payment methods
        if (automaticPaymentMethodsEnabled !== undefined) {
            requestData['automatic_payment_methods[enabled]'] = automaticPaymentMethodsEnabled;

            if (automaticPaymentMethodsEnabled === true && automaticPaymentMethodsAllowRedirects !== undefined) {
                requestData['automatic_payment_methods[allow_redirects]'] = automaticPaymentMethodsAllowRedirects;
            }
        }

        // https://stripe.com/docs/api/payment_intents/create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.stripe.com/v1/payment_intents',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
