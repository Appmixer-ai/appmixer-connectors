'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { datasetId, top } = context.messages.in.content;
        const { groupId } = context.properties;

        let path = groupId
            ? `/groups/${groupId}/datasets/${datasetId}/refreshes`
            : `/datasets/${datasetId}/refreshes`;

        if (top) {
            path += `?$top=${top}`;
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}${path}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const refreshHistory = response.data.value || [];

        return context.sendJson({
            refreshHistory,
            count: refreshHistory.length
        }, 'out');
    }
};
