'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const {
            orderId,
            amountCurrency,
            amountValue,
            linesId,
            linesQuantity,
            linesAmountCurrency,
            linesAmountValue,
            description,
            metadata,
            testmode
        } = context.messages.in.content;

        // Validate required inputs
        if (!orderId) {
            throw new context.CancelError('Order ID is required!');
        }

        // Build request body
        const requestBody = {};

        // Add amount if provided
        if (amountCurrency && amountValue) {
            requestBody.amount = {
                currency: amountCurrency,
                value: amountValue
            };
        }

        // Add lines if provided
        if (linesId || linesQuantity) {
            requestBody.lines = [];
            const line = {};
            if (linesId) {
                line.id = linesId;
            }
            if (linesQuantity) {
                line.quantity = linesQuantity;
            }
            if (linesAmountCurrency && linesAmountValue) {
                line.amount = {
                    currency: linesAmountCurrency,
                    value: linesAmountValue
                };
            }
            requestBody.lines.push(line);
        }

        // Add optional fields
        if (description) {
            requestBody.description = description;
        }

        if (metadata) {
            try {
                requestBody.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (err) {
                throw new context.CancelError('Metadata must be a valid JSON object!');
            }
        }

        // https://docs.mollie.com/reference/v2/orders-api/create-order-refund
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.mollie.com/v2/orders/${orderId}/refunds`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: requestBody,
            params: testmode ? { testmode: true } : {}
        });

        return context.sendJson(data, 'out');
    }
};
