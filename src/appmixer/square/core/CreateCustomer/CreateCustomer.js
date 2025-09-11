'use strict';

module.exports = {

    async receive(context) {

        const {
            given_name: givenName,
            family_name: familyName,
            email_address: emailAddress,
            phone_number: phoneNumber
        } = context.messages.in.content;

        const customerData = {};

        if (givenName) customerData.given_name = givenName;
        if (familyName) customerData.family_name = familyName;
        if (emailAddress) customerData.email_address = emailAddress;
        if (phoneNumber) customerData.phone_number = phoneNumber;

        const environment = context.config.environment || 'production';
        const baseUrl = environment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        // https://developer.squareup.com/reference/square/customers-api/create-customer
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${baseUrl}/v2/customers`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Square-Version': '2025-08-20'
            },
            data: customerData
        });

        return context.sendJson(data, 'out');
    }
};
