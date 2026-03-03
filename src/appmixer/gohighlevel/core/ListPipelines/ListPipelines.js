'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

module.exports = {

    async receive(context) {

        const { locationId } = context.messages.in.content;

        const response = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/opportunities/pipelines`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Version': API_VERSION
            },
            params: { locationId }
        });

        const pipelines = response.data?.pipelines || [];
        return context.sendJson({ pipelines }, 'out');
    },

    toSelectArray({ pipelines }) {
        return (pipelines || []).map(p => ({ label: p.name, value: p.id }));
    }
};
