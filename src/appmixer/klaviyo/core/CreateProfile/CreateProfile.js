'use strict';

module.exports = {

    async receive(context) {

        const { email, phoneNumber, firstName, lastName, properties } = context.messages.in.content;

        if (!email && !phoneNumber) {
            throw new context.CancelError('Email or phone number is required!');
        }

        let parsedProperties = {};
        if (properties && typeof properties === 'string') {
            parsedProperties = JSON.parse(properties);
        } else if (properties && typeof properties === 'object') {
            parsedProperties = properties;
        }

        const requestData = {
            data: {
                type: 'profile',
                attributes: {
                    ...(email && { email }),
                    ...(phoneNumber && { phone_number: phoneNumber }),
                    ...(firstName && { first_name: firstName }),
                    ...(lastName && { last_name: lastName }),
                    ...(Object.keys(parsedProperties).length > 0 && { properties: parsedProperties })
                }
            }
        };

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://a.klaviyo.com/api/profiles/',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        const profile = response.data?.data;
        if (!profile) {
            throw new context.CancelError('Invalid response from Klaviyo API');
        }

        const outputData = {
            id: profile.id,
            email: profile.attributes?.email,
            phoneNumber: profile.attributes?.phone_number,
            firstName: profile.attributes?.first_name,
            lastName: profile.attributes?.last_name,
            properties: profile.attributes?.properties || {}
        };

        return context.sendJson(outputData, 'out');
    }
};
