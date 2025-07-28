'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { id, profile_ids } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('List ID is required!');
        }

        if (!profile_ids) {
            throw new context.CancelError('Profile IDs are required!');
        }

        let profileIdArray = [];
        if (typeof profile_ids === 'string') {
            try {
                // Try to parse as JSON array first
                profileIdArray = JSON.parse(profile_ids);
            } catch (e) {
                // If not JSON, treat as comma-separated string
                profileIdArray = profile_ids.split(',').map(id => id.trim()).filter(id => id);
            }
        } else if (Array.isArray(profile_ids)) {
            profileIdArray = profile_ids;
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

        await context.httpRequest({
            method: 'DELETE',
            url: `https://a.klaviyo.com/api/lists/${id}/relationships/profiles/`,
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
