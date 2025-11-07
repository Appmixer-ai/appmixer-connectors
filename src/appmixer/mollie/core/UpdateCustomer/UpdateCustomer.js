'use strict';

module.exports = {
    async receive(context) {

        const { customerId, name, email, locale, metadata, testmode } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }

        const requestBody = {};
        if (name !== undefined) {
            requestBody.name = name;
        }
        if (email !== undefined) {
            requestBody.email = email;
        }
        if (locale !== undefined) {
            requestBody.locale = locale;
        }
        if (metadata !== undefined) {
            requestBody.metadata = metadata;
        }

        const params = {};
        if (testmode !== undefined) {
            params.testmode = testmode;
        }

        // https://docs.mollie.com/reference/v2/customers-api/update-customer
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.mollie.com/v2/customers/${customerId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: requestBody,
            params
        });

        return context.sendJson(data, 'out');
    }
};
