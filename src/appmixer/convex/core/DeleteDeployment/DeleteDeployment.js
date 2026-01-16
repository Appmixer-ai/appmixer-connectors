'use strict';

module.exports = {
    async receive(context) {

        const { deploymentName } = context.messages.in.content;

        if (!deploymentName) {
            throw new context.CancelError('Deployment Name is required!');
        }

        // https://docs.convex.dev/management-api
        await context.httpRequest({
            method: 'POST',
            url: `https://api.convex.dev/v1/deployments/${deploymentName}/delete`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
