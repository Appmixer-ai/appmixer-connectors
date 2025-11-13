'use strict';

module.exports = {

    async receive(context) {

        const { deploymentId } = context.messages.in.content;

        if (!deploymentId) {
            throw new context.CancelError('Deployment ID is required!');
        }

        const baseUrl = context.auth.baseUrl || 'https://cloud.trigger.dev';

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/api/v1/deployments/${deploymentId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
