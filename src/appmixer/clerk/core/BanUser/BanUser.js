'use strict';

module.exports = {
    async receive(context) {
        const { id, reason } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('User ID is required');
        }

        const body = {};
        if (reason) body.reason = reason;

        await context.httpRequest({
            method: 'POST',
            url: `https://api.clerk.com/v1/users/${id}/ban`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: body
        });

        return context.sendJson({}, 'out');
    }
};
