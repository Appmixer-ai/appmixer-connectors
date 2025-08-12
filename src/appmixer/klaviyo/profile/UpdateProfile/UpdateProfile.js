'use strict';

module.exports = {

    async receive(context) {

        const { profileId, email, phoneNumber, externalId, firstName, lastName,
            organization, title, image, address1, address2, city,
            country, latitude, longitude, region, zip, timezone, ip
        } = context.messages.in.content;

        if (!profileId) {
            throw new context.CancelError('Profile ID is required!');
        }

        const requestData = {
            data: {
                type: 'profile',
                id: profileId,
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

        // https://developers.klaviyo.com/en/reference/update_profile
        await context.httpRequest({
            method: 'PATCH',
            url: `https://a.klaviyo.com/api/profiles/${profileId}`,
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

        return context.sendJson({}, 'out');
    }
};
