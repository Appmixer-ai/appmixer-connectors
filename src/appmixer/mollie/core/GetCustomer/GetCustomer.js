'use strict';

module.exports = {
    async receive(context) {

        const { customerId } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }

        // https://docs.mollie.com/reference/v2/customers-api/get-customer
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/customers/${customerId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};
