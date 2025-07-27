'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { id, email, phone_number, first_name, last_name, properties } = context.messages.in.content;

        if (!id) {
            throw new Error('Profile ID is required');
        }

        let parsedProperties = {};
        if (properties && typeof properties === 'string') {
            try {
                parsedProperties = JSON.parse(properties);
            } catch (e) {
                throw new Error('Properties must be a valid JSON object');
            }
        } else if (properties && typeof properties === 'object') {
            parsedProperties = properties;
        }

        const requestData = {
            data: {
                type: 'profile',
                id: id,
                attributes: {
                    ...(email && { email }),
                    ...(phone_number && { phone_number }),
                    ...(first_name && { first_name }),
                    ...(last_name && { last_name }),
                    ...(Object.keys(parsedProperties).length > 0 && { properties: parsedProperties })
                }
            }
        };

        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://a.klaviyo.com/api/profiles/${id}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        const profile = response.data.data;
        const outputData = {
            id: profile.id,
            email: profile.attributes.email,
            phone_number: profile.attributes.phone_number,
            first_name: profile.attributes.first_name,
            last_name: profile.attributes.last_name,
            properties: profile.attributes.properties || {}
        };

        return context.sendJson(outputData, 'out');
    }
};
