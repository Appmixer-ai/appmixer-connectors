'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { datasetId, notifyOption } = context.messages.in.content;
        const { groupId } = context.properties;

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/datasets/${datasetId}/refreshes`
            : `${BASE_URL}/datasets/${datasetId}/refreshes`;

        const body = {};
        if (notifyOption) {
            body.notifyOption = notifyOption;
        }

        // A successful refresh request returns HTTP 202 Accepted with no body
        await context.httpRequest({
            method: 'POST',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson({
            status: 'accepted',
            datasetId
        }, 'out');
    }
};
