'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { datasetId, groupId } = context.messages.in.content;

        if (!datasetId) {
            throw new context.CancelError('Dataset ID is required!');
        }

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/datasets/${datasetId}`
            : `${BASE_URL}/datasets/${datasetId}`;

        await context.httpRequest({
            method: 'DELETE',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({
            status: 'deleted',
            datasetId
        }, 'out');
    }
};
