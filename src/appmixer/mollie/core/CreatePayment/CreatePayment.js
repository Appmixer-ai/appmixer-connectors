
'use strict';

module.exports = {

    async receive(context) {

        const {
            currency,
            amount,
            description,
            redirectUrl,
            webhookUrl,
            method,
            metadata,
            locale,
            sequenceType,
            customerId,
            mandateId,
            profileId
        } = context.messages.in.content;

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
        if (webhookUrl) payload.webhookUrl = webhookUrl;
        if (method) payload.method = method;
        if (metadata) payload.metadata = metadata;
        if (locale) payload.locale = locale;
        if (sequenceType) payload.sequenceType = sequenceType;
        if (customerId) payload.customerId = customerId;
        if (mandateId) payload.mandateId = mandateId;
        if (profileId) payload.profileId = profileId;

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
