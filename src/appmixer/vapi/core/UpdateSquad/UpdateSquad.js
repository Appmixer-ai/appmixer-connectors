'use strict';

module.exports = {
    async receive(context) {
        const { squadId, name, members } = context.messages.in.content;

        if (!squadId) {
            throw new context.CancelError('Squad ID is required!');
        }

        const payload = {};

        if (name) {
            payload.name = name;
        }

        if (members) {
            try {
                payload.members = typeof members === 'string' ? JSON.parse(members) : members;
            } catch (error) {
                throw new context.CancelError('Members must be a valid JSON array!');
            }
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
