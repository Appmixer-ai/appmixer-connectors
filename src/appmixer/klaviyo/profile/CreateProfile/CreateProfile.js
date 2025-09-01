'use strict';

module.exports = {

    async receive(context) {

        const { email, phoneNumber, externalId, firstName, lastName,
            organization, title, image, address1, address2, city,
            country, latitude, longitude, region, zip, timezone, ip
        } = context.messages.in.content;

        if (!email && !phoneNumber && !externalId) {
            throw new context.CancelError('Email or Phone Number or External ID is required!');
        }

        const requestData = {
            data: {
                type: 'profile',
                attributes: {
                    email,
                    phone_number: phoneNumber,
                    external_id: externalId,
                    first_name: firstName,
                    last_name: lastName,
                    organization,
                    title,
                    image,
                    location: {
                        address1,
                        address2,
                        city,
                        country,
                        latitude: latitude ? parseFloat(latitude) : undefined,
                        longitude: longitude ? parseFloat(longitude) : undefined,
                        region,
                        zip,
                        timezone,
                        ip
                    }
                }
            }
        };

        // https://developers.klaviyo.com/en/reference/create_profile
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://a.klaviyo.com/api/profiles',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            params: {
                'additional-fields[profile]': 'subscriptions,predictive_analytics'
            },
            data: requestData
        });

        const profile = data.data;

        return context.sendJson(profile, 'out');
    }
};
