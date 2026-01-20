
'use strict';

module.exports = {

    async receive(context) {

        const {
            description,
            currency,
            amount,
            redirectUrl,
            cancelUrl,
            webhookUrl,
            locale,
            method,
            metadata
        } = context.messages.in.content;

        // Validate required fields
        if (!description) {
            throw new context.CancelError('Description is required!');
        }
        if (!currency) {
            throw new context.CancelError('Currency is required!');
        }
        if (!amount) {
            throw new context.CancelError('Amount is required!');
        }
        if (!redirectUrl) {
            throw new context.CancelError('Redirect URL is required!');
        }

        // Build the request payload
        const payload = {
            amount: {
                currency: currency,
                value: amount
            },
            description: description,
            redirectUrl: redirectUrl
        };

        // Add optional fields if provided
        if (cancelUrl) payload.cancelUrl = cancelUrl;
        if (webhookUrl) payload.webhookUrl = webhookUrl;
        if (locale) payload.locale = locale;
        if (method) payload.method = method;
        if (metadata) {
            try {
                // If metadata is a string, try to parse it as JSON
                payload.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (error) {
                throw new context.CancelError('Metadata must be valid JSON format!');
            }
        }

        // https://docs.mollie.com/reference/v2/payments-api/create-payment
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.mollie.com/v2/payments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
