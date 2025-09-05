'use strict';

module.exports = {
    async receive(context) {

        const { customEndpoint, method, parameters } = context.messages.in.content;

        if (!customEndpoint) {
            throw new context.CancelError('Custom Endpoint is required!');
        }

        if (!method) {
            throw new context.CancelError('Method is required!');
        }

        // Parse parameters if it's a JSON string
        let parsedParameters = {};
        if (parameters) {
            if (typeof parameters === 'string') {
                try {
                    parsedParameters = JSON.parse(parameters);
                } catch {
                    throw new context.CancelError('Invalid JSON format in parameters');
                }
            }
        }

        // https://stripe.com/docs/api
        const { data } = await context.httpRequest({
            method: method,
            url: `https://api.stripe.com/v1/${customEndpoint}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
                ...parsedParameters
            }
        });

        await context.log({ step: 'http-request-success', response: data });

        return context.sendJson({ response: data }, 'out');
    }
};
