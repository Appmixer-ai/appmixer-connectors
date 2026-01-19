'use strict';

module.exports = {

    async receive(context) {

        const { datasetId } = context.messages.in.content;

        if (!datasetId) {
            throw new context.CancelError('Dataset ID is required!');
        }

        const url = `https://api.axiom.co/v2/datasets/${datasetId}`;

        await context.httpRequest({
            method: 'DELETE',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'x-axiom-org-id': context.auth.organizationId
            }
        });

        return context.sendJson({}, 'out');
    }
};
