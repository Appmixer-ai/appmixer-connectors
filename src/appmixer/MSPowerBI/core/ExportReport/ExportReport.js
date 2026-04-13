'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { reportId, format } = context.messages.in.content;
        const { groupId } = context.properties;

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/reports/${reportId}/ExportTo`
            : `${BASE_URL}/reports/${reportId}/ExportTo`;

        const response = await context.httpRequest({
            method: 'POST',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                format
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
