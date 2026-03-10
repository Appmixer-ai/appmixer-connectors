'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

module.exports = {

    async receive(context) {

        const { locationId } = context.messages.in.content;
        const resolvedLocationId = locationId || context.auth.locationId;

        const response = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/calendars/`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Version': API_VERSION
            },
            params: { locationId: resolvedLocationId }
        });

        const calendars = response.data?.calendars || [];
        return context.sendJson({ calendars }, 'out');
    },

    toSelectArray({ calendars }) {
        return (calendars || []).map(c => ({ label: c.name, value: c.id }));
    }
};
