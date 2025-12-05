'use strict';

module.exports = {
    async receive(context) {
        const {
            eventType,
            userId,
            deviceId,
            eventProperties
        } = context.messages.in.content;

        // Validate required fields
        if (!eventType) {
            throw new context.CancelError('Event Type is required!');
        }

        if (!userId && !deviceId) {
            throw new context.CancelError('Either User ID or Device ID is required!');
        }

        // Build the event object
        const event = {
            event_type: eventType
        };

        // Add optional user/device identifiers
        if (userId) {
            event.user_id = userId;
        }
        if (deviceId) {
            event.device_id = deviceId;
        }

        // Add optional properties
        if (eventProperties) {
            event.event_properties = typeof eventProperties === 'string' ? JSON.parse(eventProperties) : eventProperties;
        }

        // Build the request payload
        const payload = {
            api_key: context.auth.apiKey,
            events: [event]
        };

        const isEU = context.auth.isEU === 'true';

        // Make the HTTP request with Basic Auth
        // const basicAuth = Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64');

        const { data } = await context.httpRequest({
            method: 'POST',
            url: isEU ? 'https://api.eu.amplitude.com/2/httpapi' : 'https://api.amplitude.com/2/httpapi',
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
