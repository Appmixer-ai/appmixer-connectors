'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { datasetId } = context.messages.in.content;
        const { groupId } = context.properties;

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/datasets/${datasetId}`
            : `${BASE_URL}/datasets/${datasetId}`;

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
