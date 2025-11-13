'use strict';

module.exports = {

    async receive(context) {

        const {
            userId,
            deviceId,
            userPropertiesSet,
            userPropertiesSetOnce,
            userPropertiesAdd,
            userPropertiesAppend,
            userPropertiesPrepend,
            userPropertiesUnset,
            userPropertiesRemove,
            groups,
            groupProperties
        } = context.messages.in.content;

        // Validate that at least userId or deviceId is provided
        if (!userId && !deviceId) {
            throw new context.CancelError('User ID or Device ID is required!');
        }

        // Build the event object for user property updates
        const event = {
            event_type: '$identify'
        };

        if (userId) {
            event.user_id = userId;
        }

        if (deviceId) {
            event.device_id = deviceId;
        }

        // Build user_properties object with operations
        const userProperties = {};

        if (userPropertiesSet) {
            userProperties.$set = typeof userPropertiesSet === 'string' ? JSON.parse(userPropertiesSet) : userPropertiesSet;
        }

        if (userPropertiesSetOnce) {
            userProperties.$setOnce = typeof userPropertiesSetOnce === 'string' ? JSON.parse(userPropertiesSetOnce) : userPropertiesSetOnce;
        }

        if (userPropertiesAdd) {
            userProperties.$add = typeof userPropertiesAdd === 'string' ? JSON.parse(userPropertiesAdd) : userPropertiesAdd;
        }

        if (userPropertiesAppend) {
            userProperties.$append = typeof userPropertiesAppend === 'string' ? JSON.parse(userPropertiesAppend) : userPropertiesAppend;
        }

        if (userPropertiesPrepend) {
            userProperties.$prepend = typeof userPropertiesPrepend === 'string' ? JSON.parse(userPropertiesPrepend) : userPropertiesPrepend;
        }

        if (userPropertiesUnset) {
            const unsetArray = typeof userPropertiesUnset === 'string' ? JSON.parse(userPropertiesUnset) : userPropertiesUnset;
            userProperties.$unset = unsetArray;
        }

        if (userPropertiesRemove) {
            userProperties.$remove = typeof userPropertiesRemove === 'string' ? JSON.parse(userPropertiesRemove) : userPropertiesRemove;
        }

        if (userProperties && Object.keys(userProperties).length > 0) {
            event.user_properties = userProperties;
        }

        if (groups) {
            event.groups = typeof groups === 'string' ? JSON.parse(groups) : groups;
        }

        if (groupProperties) {
            event.group_properties = typeof groupProperties === 'string' ? JSON.parse(groupProperties) : groupProperties;
        }

        // Create the request payload using the HTTP V2 API format
        const payload = {
            api_key: context.auth.apiKey,
            events: [event]
        };

        // Make the HTTP request with Basic Auth
        const basicAuth = Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64');

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.amplitude.com/2/httpapi',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
