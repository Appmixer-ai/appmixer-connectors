'use strict';

module.exports = {
    async receive(context) {

        const { method, url, headers, body } = context.messages.in.content;

        // Validate required inputs
        if (!method) {
            throw new context.CancelError('Method is required!');
        }
        if (!url) {
            throw new context.CancelError('URL is required!');
        }

        // https://console.groq.com/docs/api-reference#api-call
        const { data } = await context.httpRequest({
            method: method,
            url: `https://api.groq.com/v1/${url}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                ...headers // Spread any additional headers provided in the input
            },
            data: body || null // Use body if provided, otherwise null
        });

        return context.sendJson(data, 'out');
    }
};
