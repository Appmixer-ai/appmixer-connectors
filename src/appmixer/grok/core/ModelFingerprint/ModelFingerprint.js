'use strict';

module.exports = {
    async receive(context) {

        const { model } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }

        // https://docs.x.ai/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/fingerprint',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                model
            }
        });

        return context.sendJson(data, 'out');
    }
};
