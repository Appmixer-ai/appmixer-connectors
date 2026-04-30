'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { dashboardId , groupId } = context.messages.in.content;


        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/dashboards/${dashboardId}/tiles`
            : `${BASE_URL}/dashboards/${dashboardId}/tiles`;

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
