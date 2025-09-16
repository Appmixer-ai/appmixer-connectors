/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { customer_id, email, first_name, last_name, phone } = context.messages.in.content;

        // Customer ID is required
        if (!customer_id) {
            throw new context.CancelError('Customer ID is required!');
        }

        const requestBody = [];
        const updateData = { id: customer_id };

        if (email) updateData.email = email;
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (phone) updateData.phone = phone;

        requestBody.push(updateData);

        // https://developer.bigcommerce.com/api-reference/store-management/customers-v3/customers/updateacustomer
        await context.httpRequest({
            method: 'PUT',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/customers`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            data: requestBody
        });

        return context.sendJson({}, 'out');
    }
};
