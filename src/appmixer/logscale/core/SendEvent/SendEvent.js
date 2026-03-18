'use strict';

module.exports = {

    async receive(context) {

        const {
            event,
            source,
            type,
            repository
        } = context.messages.in.content;

        if (event === undefined || event === null || event === '') {
            throw new context.CancelError('Event is required!');
        }

        const parsedEvent = parseEvent(event, context);
        const requestBody = {
            event: parsedEvent,
            time: Math.floor(Date.now() / 1000)
        };

        if (source) {
            requestBody.source = source;
        }

        if (type) {
            requestBody.sourcetype = type;
        }

        if (repository) {
            requestBody.index = repository;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: context.auth.url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data,
            requestBody
        }, 'out');
    }
};

function parseEvent(event, context) {

    if (typeof event !== 'string') {
        return event;
    }

    try {
        return JSON.parse(event);
    } catch {
        if (!event.trim()) {
            throw new context.CancelError('Event is required!');
        }
        return event;
    }
}