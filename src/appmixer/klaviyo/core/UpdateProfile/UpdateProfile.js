'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { id, email, phoneNumber, firstName, lastName, properties } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Profile ID is required!');
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
                id: id,
                attributes: {
                    ...(email && { email }),
                    ...(phoneNumber && { phone_number: phoneNumber }),
                    ...(firstName && { first_name: firstName }),
                    ...(lastName && { last_name: lastName }),
                    ...(Object.keys(parsedProperties).length > 0 && { properties: parsedProperties })
                }
            }
        };

        await context.httpRequest({
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

        return context.sendJson({}, 'out');
    }
};
