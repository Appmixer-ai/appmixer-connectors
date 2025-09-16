/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { customer_id } = context.messages.in.content;

        // Customer ID is required
        if (!customer_id) {
            throw new context.CancelError('Customer ID is required!');
        }

        // https://developer.bigcommerce.com/api-reference/store-management/customers-v3/customers/getacustomer
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/customers`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            params: {
                'id:in': customer_id
            }
        });

        // BigCommerce returns customers in an array, get the first one
        const customer = data.data && data.data.length > 0 ? data.data[0] : null;

        if (!customer) {
            throw new context.CancelError('Customer not found.');
        }

        return context.sendJson(customer, 'out');
    }
};
