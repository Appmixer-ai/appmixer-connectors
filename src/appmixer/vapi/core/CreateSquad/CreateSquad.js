'use strict';

const { normalizeMultiselectInput } = require('../../lib');

module.exports = {
    async receive(context) {
        const { name, members } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        if (!members) {
            throw new context.CancelError('Members is required!');
        }

        const payload = {
            name,
            members: normalizeMultiselectInput(members, context, 'Members').map(assistantId => ({ assistantId }))
        };

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

