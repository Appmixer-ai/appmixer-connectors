'use strict';

module.exports = {

    async receive(context) {

        const { runId } = context.messages.in.content;

        if (!runId) {
            throw new context.CancelError('Run ID is required!');
        }

        const baseUrl = context.auth.baseUrl || 'https://cloud.trigger.dev';

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/api/v1/runs/${runId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
