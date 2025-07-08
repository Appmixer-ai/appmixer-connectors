'use strict';

const lib = require('../../lib.generated');

const schema = {
    id: { type: 'string', title: 'Payment Intent ID' },
    object: { type: 'string', title: 'Object Type' },
    amount: { type: 'number', title: 'Amount' },
    amount_capturable: { type: 'number', title: 'Amount Capturable' },
    amount_received: { type: 'number', title: 'Amount Received' },
    currency: { type: 'string', title: 'Currency' },
    status: { type: 'string', title: 'Status' },
    created: { type: 'number', title: 'Created (Unix Timestamp)' },
    livemode: { type: 'boolean', title: 'Live Mode' },
    customer: { type: ['string', 'null'], title: 'Customer ID' },
    description: { type: ['string', 'null'], title: 'Description' }
};

module.exports = {
    async receive(context) {
        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, {
                label: 'data',
                value: 'data'
            });
        }

        let response;
        if (query && query.trim()) {
            // If query is present, use search endpoint
            // Stripe: https://stripe.com/docs/api/payment_intents/search
            response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.stripe.com/v1/payment_intents/search',
                headers: {
                    Authorization: `Bearer ${context.auth.apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                params: {
                    query,
                    limit: 100 // Default limit, can be adjusted as needed
                }
            });
        } else {
            // If no query, use list endpoint
            // Stripe: https://stripe.com/docs/api/payment_intents/list
            response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.stripe.com/v1/payment_intents',
                headers: {
                    Authorization: `Bearer ${context.auth.apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                params: {
                    limit: 100 // Default limit, can be adjusted as needed
                }
            });
        }

        // Adjust for response structure: { data: { data: [...] } }
        const paymentIntents = response.data && response.data.data ? response.data.data : [];

        // Check if no results found and send to notFound port
        if (paymentIntents.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({
            context,
            records: paymentIntents,
            outputType,
            arrayPropertyValue: 'data'
        });
    }
};
