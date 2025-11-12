'use strict';

module.exports = {
    async receive(context) {

        const { events, options_min_id_length } = context.messages.in.content;

        if (!events || !Array.isArray(events) || events.length === 0) {
            throw new context.CancelError('Events is required and must be a non-empty array!');
        }

        const requestBody = {
            api_key: context.auth.apiKey,
            events: events
        };

        if (options_min_id_length !== undefined && options_min_id_length !== null) {
            requestBody.options = {
                min_id_length: options_min_id_length
            };
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.amplitude.com/2/httpapi',
            headers: {
                'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(response.data, 'out');
    }
};
