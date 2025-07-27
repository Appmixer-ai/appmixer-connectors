'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new Error('Profile ID is required');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://a.klaviyo.com/api/profiles/${id}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            }
        });

        return context.sendJson({ id, deleted: true }, 'out');
    }
};
