'use strict';

module.exports = {
    async receive(context) {
        const { userId, deviceId, userPropertiesSet, userPropertiesSetOnce } = context.messages.in.content;

        // Either userId or deviceId is required
        if (!userId && !deviceId) {
            throw new context.CancelError('Either User ID or Device ID is required!');
        }

        // Build the identification object
        const identification = {};

        if (userId) {
            identification.user_id = userId;
        }

        if (deviceId) {
            identification.device_id = deviceId;
        }

        // Add user properties if provided
        if (userPropertiesSet || userPropertiesSetOnce) {
            identification.user_properties = {};

            if (userPropertiesSet) {
                // Handle both object and string inputs
                const setProps = typeof userPropertiesSet === 'string' ? JSON.parse(userPropertiesSet) : userPropertiesSet;
                identification.user_properties.$set = setProps;
            }

            if (userPropertiesSetOnce) {
                // Handle both object and string inputs
                const setOnceProps = typeof userPropertiesSetOnce === 'string' ? JSON.parse(userPropertiesSetOnce) : userPropertiesSetOnce;
                identification.user_properties.$setOnce = setOnceProps;
            }
        }

        // Build the request body with identification data
        const requestBody = {
            identification_request_body: [
                {
                    identification
                }
            ]
        };

        // https://developers.amplitude.com/docs/identify-api
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.amplitude.com/identify',
            headers: {
                'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
