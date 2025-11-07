'use strict';

module.exports = {
    async receive(context) {
        const {
            customerId,
            amountCurrency,
            amountValue,
            interval,
            description,
            startDate,
            times,
            mandateId,
            webhookUrl,
            metadata,
            testmode
        } = context.messages.in.content;

        // Validate required fields
        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }
        if (!amountValue) {
            throw new context.CancelError('Amount Value is required!');
        }
        if (!amountCurrency) {
            throw new context.CancelError('Amount Currency is required!');
        }
        if (!interval) {
            throw new context.CancelError('Interval is required!');
        }

        // Build request body
        const body = {
            amount: {
                value: amountValue,
                currency: amountCurrency
            },
            interval: interval,
            startDate: startDate
        };

        // Add optional fields if provided
        if (description) {
            body.description = description;
        }
        if (times) {
            body.times = times;
        }
        if (mandateId) {
            body.mandateId = mandateId;
        }
        if (webhookUrl) {
            body.webhookUrl = webhookUrl;
        }
        if (testmode !== undefined && testmode !== null) {
            body.testmode = testmode;
        }
        if (metadata) {
            body.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        }

        // https://docs.mollie.com/reference/v2/subscriptions-api/create-subscription
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.mollie.com/v2/customers/${customerId}/subscriptions`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
