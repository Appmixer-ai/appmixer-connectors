'use strict';

module.exports = {

    async receive(context) {

        const { listId, profileIds } = context.messages.in.content;

        if (!listId) {
            throw new context.CancelError('List ID is required!');
        }

        if (!profileIds) {
            throw new context.CancelError('Profile IDs are required!');
        }

        let profileIdArray = [];
        if (typeof profileIds === 'string') {
            try {
                // Try to parse as JSON array first
                profileIdArray = JSON.parse(profileIds);
            } catch (e) {
                // If not JSON, treat as comma-separated string
                profileIdArray = profileIds.split(',').map(id => id.trim()).filter(id => id);
            }
        } else if (Array.isArray(profileIds)) {
            profileIdArray = profileIds;
        } else {
            throw new context.CancelError('Profile IDs must be an array or comma-separated string!');
        }

        if (profileIdArray.length === 0) {
            throw new context.CancelError('At least one profile ID is required!');
        }

        const requestData = {
            data: profileIdArray.map(profileId => ({
                type: 'profile',
                id: profileId
            }))
        };

        // https://developers.klaviyo.com/en/reference/add_profiles_to_list
        await context.httpRequest({
            method: 'POST',
            url: `https://a.klaviyo.com/api/lists/${listId}/relationships/profiles`,
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
