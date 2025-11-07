'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const {
            customerId,
            subscriptionId,
            amountValue,
            amountCurrency,
            times,
            description,
            mandateId,
            startDate,
            webhookUrl,
            metadata,
            testmode
        } = context.messages.in.content;

        // Validate required inputs
        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }

        if (!subscriptionId) {
            throw new context.CancelError('Subscription Id is required!');
        }

        // Build request body with only provided fields
        const requestBody = {};

        if (amountValue && amountCurrency) {
            requestBody.amount = {
                value: amountValue,
                currency: amountCurrency
            };
        }

        if (times !== undefined && times !== null) {
            requestBody.times = times;
        }

        if (description) {
            requestBody.description = description;
        }

        if (mandateId) {
            requestBody.mandateId = mandateId;
        }

        if (startDate) {
            requestBody.startDate = startDate;
        }

        if (webhookUrl) {
            requestBody.webhookUrl = webhookUrl;
        }

        if (metadata) {
            if (typeof metadata === 'string') {
                requestBody.metadata = JSON.parse(metadata);
            } else {
                requestBody.metadata = metadata;
            }
        }

        if (testmode !== undefined && testmode !== null) {
            requestBody.testmode = testmode;
        }

        // https://docs.mollie.com/reference/v2/subscriptions-api/update-subscription
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.mollie.com/v2/customers/${customerId}/subscriptions/${subscriptionId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
