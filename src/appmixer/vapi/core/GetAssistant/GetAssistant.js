'use strict';

module.exports = {
    async receive(context) {
        const { assistantId } = context.messages.in.content;

        if (!assistantId) {
            throw new context.CancelError('Assistant ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.vapi.ai/assistant/${assistantId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({
            id: data.id,
            orgId: data.orgId,
            name: data.name,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        }, 'out');
    }
};
