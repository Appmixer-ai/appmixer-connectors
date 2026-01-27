'use strict';

module.exports = {
    async receive(context) {
        const { name, assistantId } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const payload = { name };

        // Add members array with assistantId if provided
        if (assistantId) {
            payload.members = [
                {
                    assistantId: assistantId
                }
            ];
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.vapi.ai/squad',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
