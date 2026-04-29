'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { name, groupId } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Dashboard name is required!');
        }

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/dashboards`
            : `${BASE_URL}/dashboards`;

        const response = await context.httpRequest({
            method: 'POST',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: { name }
        });

        const dashboard = response.data;

        return context.sendJson({
            id: dashboard.id,
            displayName: dashboard.displayName,
            isReadOnly: dashboard.isReadOnly,
            embedUrl: dashboard.embedUrl,
            webUrl: dashboard.webUrl
        }, 'out');
    }
};
