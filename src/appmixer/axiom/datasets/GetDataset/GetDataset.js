'use strict';

module.exports = {

    async receive(context) {

        const { datasetId } = context.messages.in.content;

        if (!datasetId) {
            throw new context.CancelError('Dataset ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.axiom.co/v1/datasets/${datasetId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};
