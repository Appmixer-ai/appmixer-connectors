'use strict';

module.exports = {

    async receive(context) {

        const { sandboxId } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.daytona.io/sandbox/${sandboxId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({
            id: data.id,
            name: data.name,
            language: data.language,
            image: data.image,
            status: data.status,
            createdAt: data.created_at || data.createdAt,
            updatedAt: data.updated_at || data.updatedAt
        }, 'out');
    }
};
