'use strict';

module.exports = {
    async receive(context) {
        const { name, members } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const payload = { name };

        if (members) {
            try {
                payload.members = typeof members === 'string' ? JSON.parse(members) : members;
            } catch (error) {
                throw new context.CancelError('Invalid JSON format for members');
            }
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
