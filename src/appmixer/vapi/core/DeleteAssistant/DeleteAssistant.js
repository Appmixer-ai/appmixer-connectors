'use strict';

module.exports = {
    async receive(context) {
        const { assistantId } = context.messages.in.content;

        if (!assistantId) {
            throw new context.CancelError('Assistant ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.vapi.ai/assistant/${assistantId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
