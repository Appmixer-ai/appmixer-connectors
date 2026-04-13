'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { groupId } = context.properties;

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/datasets`
            : `${BASE_URL}/datasets`;

        const response = await context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const datasets = response.data.value || [];

        return context.sendJson({
            datasets,
            count: datasets.length
        }, 'out');
    }
};
