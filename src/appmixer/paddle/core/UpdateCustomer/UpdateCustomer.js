'use strict';

module.exports = {
    async receive(context) {
        const {
            customerId,
            email,
            name,
            locale,
            marketingConsent,
            addressLine1,
            addressLine2,
            addressCity,
            addressPostalCode,
            addressRegion,
            addressCountryCode,
            metadata
        } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }

        // Build request body with only provided fields
        const requestData = {};

        if (email !== undefined) {
            requestData.email = email;
        }

        if (name !== undefined) {
            requestData.name = name;
        }

        if (locale !== undefined) {
            requestData.locale = locale;
        }

        if (marketingConsent !== undefined) {
            requestData.marketing_consent = marketingConsent;
        }

        // Build address object if any address fields are provided
        if (addressLine1 || addressLine2 || addressCity || addressPostalCode || addressRegion || addressCountryCode) {
            requestData.address = {};

            if (addressLine1 !== undefined) {
                requestData.address.line1 = addressLine1;
            }

            if (addressLine2 !== undefined) {
                requestData.address.line2 = addressLine2;
            }

            if (addressCity !== undefined) {
                requestData.address.city = addressCity;
            }

            if (addressPostalCode !== undefined) {
                requestData.address.postal_code = addressPostalCode;
            }

            if (addressRegion !== undefined) {
                requestData.address.region = addressRegion;
            }

            if (addressCountryCode !== undefined) {
                requestData.address.country_code = addressCountryCode;
            }
        }

        if (metadata !== undefined) {
            requestData.metadata = metadata;
        }

        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.paddle.com/customers/${customerId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
