'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { reportId } = context.messages.in.content;
        const { groupId } = context.properties;

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/reports/${reportId}`
            : `${BASE_URL}/reports/${reportId}`;

        const response = await context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
