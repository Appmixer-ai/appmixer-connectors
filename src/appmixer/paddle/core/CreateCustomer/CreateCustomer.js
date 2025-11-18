'use strict';

module.exports = {
    async receive(context) {
        const {
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

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const requestBody = {
            email
        };

        if (name) {
            requestBody.name = name;
        }

        if (locale) {
            requestBody.locale = locale;
        }

        if (typeof marketingConsent === 'boolean') {
            requestBody.marketing_consent = marketingConsent;
        }

        if (addressLine1 || addressLine2 || addressCity || addressPostalCode || addressRegion || addressCountryCode) {
            requestBody.address = {};
            if (addressLine1) requestBody.address.line_1 = addressLine1;
            if (addressLine2) requestBody.address.line_2 = addressLine2;
            if (addressCity) requestBody.address.city = addressCity;
            if (addressPostalCode) requestBody.address.postal_code = addressPostalCode;
            if (addressRegion) requestBody.address.region = addressRegion;
            if (addressCountryCode) requestBody.address.country_code = addressCountryCode;
        }

        if (metadata && typeof metadata === 'object') {
            requestBody.custom_data = metadata;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.paddle.com/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(response.data, 'out');
    }
};
