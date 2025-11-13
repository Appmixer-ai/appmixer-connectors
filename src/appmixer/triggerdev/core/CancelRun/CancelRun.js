'use strict';

module.exports = {

    async receive(context) {

        const { runId } = context.messages.in.content;

        if (!runId) {
            throw new context.CancelError('Run ID is required!');
        }

        const baseUrl = context.auth.baseUrl || 'https://cloud.trigger.dev';

        await context.httpRequest({
            method: 'POST',
            url: `${baseUrl}/api/v1/runs/${runId}/cancel`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
