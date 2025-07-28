'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Profile ID is required!');
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: `https://a.klaviyo.com/api/profiles/${id}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            }
        });

        const profile = response.data?.data;
        if (!profile) {
            throw new context.CancelError('Profile not found or invalid response from Klaviyo API');
        }

        const outputData = {
            id: profile.id,
            email: profile.attributes?.email,
            phone_number: profile.attributes?.phone_number,
            first_name: profile.attributes?.first_name,
            last_name: profile.attributes?.last_name,
            properties: profile.attributes?.properties || {}
        };

        return context.sendJson(outputData, 'out');
    }
};
