'use strict';

module.exports = {

    async receive(context) {

        const { datasetId, name, description } = context.messages.in.content;

        if (!datasetId) {
            throw new context.CancelError('Dataset ID is required!');
        }

        const requestBody = {};
        if (name) {
            requestBody.name = name;
        }
        if (description) {
            requestBody.description = description;
        }

        const headers = {
            'Authorization': `Bearer ${context.auth.apiToken}`,
            'Content-Type': 'application/json',
            'x-axiom-org-id': context.auth.organizationId
        };

        await context.httpRequest({
            method: 'PUT',
            url: `https://api.axiom.co/v2/datasets/${datasetId}`,
            headers,
            data: requestBody
        });

        return context.sendJson({}, 'out');
    }
};
