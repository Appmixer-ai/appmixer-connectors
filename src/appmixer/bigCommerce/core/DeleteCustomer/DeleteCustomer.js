/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { customer_id } = context.messages.in.content;

        if (!customer_id) {
            throw new context.CancelError('Customer ID is required!');
        }

        // https://developer.bigcommerce.com/api-reference/store-management/customers/customers/deletecustomers
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/customers`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            params: {
                'id:in': customer_id
            }
        });

        return context.sendJson({}, 'out');
    }
};
