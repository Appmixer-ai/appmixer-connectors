'use strict';

module.exports = {

    async receive(context) {

        const { datasetId } = context.messages.in.content;

        if (!datasetId) {
            throw new context.CancelError('Dataset ID is required!');
        }

        const headers = {
            'Authorization': `Bearer ${context.auth.apiToken}`,
            'Content-Type': 'application/json',
            'x-axiom-org-id': context.auth.organizationId
        };

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.axiom.co/v2/datasets/${datasetId}`,
            headers
        });

        return context.sendJson(data, 'out');
    }
};
