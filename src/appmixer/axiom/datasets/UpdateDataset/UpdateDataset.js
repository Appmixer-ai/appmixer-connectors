'use strict';

module.exports = {

    async receive(context) {

        const { datasetId, description } = context.messages.in.content;

        if (!datasetId) {
            throw new context.CancelError('Dataset ID is required!');
        }

        const requestBody = {};
        if (description) {
            requestBody.description = description;
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.axiom.co/v1/datasets/${datasetId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson({}, 'out');
    }
};
