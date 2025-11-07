'use strict';

module.exports = {
    async receive(context) {
        const {
            description,
            amountCurrency,
            amountValue,
            redirectUrl,
            webhookUrl,
            expiresAt,
            profileId,
            metadata,
            testmode
        } = context.messages.in.content;

        // Validate required fields
        if (!description) {
            throw new context.CancelError('Description is required!');
        }
        if (!amountCurrency) {
            throw new context.CancelError('Currency is required!');
        }
        if (!amountValue) {
            throw new context.CancelError('Amount is required!');
        }

        // Build request payload
        const data = {
            description,
            amount: {
                currency: amountCurrency,
                value: amountValue
            },
            testmode
        };

        // Add optional fields
        if (redirectUrl) {
            data.redirectUrl = redirectUrl;
        }
        if (webhookUrl) {
            data.webhookUrl = webhookUrl;
        }
        if (expiresAt) {
            data.expiresAt = expiresAt;
        }
        if (profileId) {
            data.profileId = profileId;
        }
        if (metadata) {
            try {
                data.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (err) {
                throw new context.CancelError('Metadata must be a valid JSON object!');
            }
        }

        // https://docs.mollie.com/reference/v2/payment-links-api/create-payment-link
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.mollie.com/v2/payment-links',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data
        });

        return context.sendJson(response.data, 'out');
    }
};
