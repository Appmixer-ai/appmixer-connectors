'use strict';

module.exports = {

    async receive(context) {

        // https://developer.bigcommerce.com/docs/rest-management/orders/order-status#get-all-order-statuses
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v2/order_statuses`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            }
        });

        // BigCommerce API returns orders status array directly
        const statuses = Array.isArray(data) ? data : [];

        await context.sendJson({ statuses }, 'out');
    },

    statusToSelectArray({ statuses }) {
        return statuses.map(status => {
            return { label: status.name, value: status.id };
        });
    }
};
