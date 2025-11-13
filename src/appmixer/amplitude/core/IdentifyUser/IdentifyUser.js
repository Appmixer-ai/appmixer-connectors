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

        // https://developers.amplitude.com/docs/identify-api
        await context.httpRequest({
            method: 'POST',
            url: 'https://api.eu.amplitude.com/identify',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
                api_key: context.auth.apiKey,
                identification: JSON.stringify(identification)
            }
        });

        return context.sendJson({}, 'out');
    }
};
