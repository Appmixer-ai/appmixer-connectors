'use strict';

const { normalizeMultiselectInput } = require('../../lib');

module.exports = {
    async receive(context) {
        const { squadId, name, members } = context.messages.in.content;

        if (!squadId) {
            throw new context.CancelError('Squad ID is required!');
        }

        if (!members) {
            throw new context.CancelError('Members is required!');
        }

        const payload = {
            members: normalizeMultiselectInput(members, context, 'Members').map(assistantId => ({ assistantId }))
        };

        if (name) {
            payload.name = name;
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.vapi.ai/squad/${squadId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson({}, 'out');
    }
};
