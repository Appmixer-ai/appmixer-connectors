'use strict';

module.exports = {

    async receive(context) {

        const { profileId } = context.messages.in.content;

        if (!profileId) {
            throw new context.CancelError('Profile ID is required!');
        }

        // https://developers.klaviyo.com/en/reference/get_profile
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://a.klaviyo.com/api/profiles/${profileId}`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            params: {
                'additional-fields[profile]': 'subscriptions,predictive_analytics'
            }
        });

        const profile = data.data;

        return context.sendJson(profile, 'out');
    }
};
