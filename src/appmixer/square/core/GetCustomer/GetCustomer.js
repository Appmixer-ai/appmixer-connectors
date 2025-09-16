'use strict';

module.exports = {

    async receive(context) {

        const { customer_id: customerId } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }

        const environment = context.config.environment || 'production';
        const baseUrl = environment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        // https://developer.squareup.com/reference/square/customers-api/retrieve-customer
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/v2/customers/${customerId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Square-Version': '2025-08-20'
            }
        });

        return context.sendJson(data.customer, 'out');
    }
};
