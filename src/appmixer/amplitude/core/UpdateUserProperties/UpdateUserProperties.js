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

        // Build the identification object
        const identification = {};

        if (userId) {
            identification.user_id = userId;
        }

        if (deviceId) {
            identification.device_id = deviceId;
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

        if (groups) {
            identification.groups = typeof groups === 'string' ? JSON.parse(groups) : groups;
        }

        if (groupProperties) {
            identification.group_properties = typeof groupProperties === 'string' ? JSON.parse(groupProperties) : groupProperties;
        }

        // Only add user_properties if there are any operations
        if (Object.keys(userProperties).length > 0) {
            identification.user_properties = userProperties;
        }

        // Create the request payload
        const payload = {
            identification: [identification]
        };

        // Build Basic Auth header from apiKey and secretKey
        const authHeader = Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64');

        // https://developers.amplitude.com/docs/identify-api
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.amplitude.com/identify',
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
