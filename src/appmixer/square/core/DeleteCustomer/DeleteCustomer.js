'use strict';

module.exports = {

    async receive(context) {

        const {
            customer_id: customerId,
            version
        } = context.messages.in.content;

        // Validate required field
        if (!customerId) {
            throw new context.CancelError('Customer ID is required.');
        }

        const environment = context.config.environment || 'production';
        const baseUrl = environment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        // Build URL with customer ID
        let url = `${baseUrl}/v2/customers/${encodeURIComponent(customerId)}`;

        // Add version as query parameter if provided
        if (version !== undefined && version !== null && version !== '') {
            url += `?version=${encodeURIComponent(version)}`;
        }

        // https://developer.squareup.com/reference/square/customers-api/delete-customer
        await context.httpRequest({
            method: 'DELETE',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Square-Version': '2025-08-20'
            }
        });

        // Successful deletion - Square API returns empty response body for successful deletes
        return context.sendJson({}, 'out');
    }
};
