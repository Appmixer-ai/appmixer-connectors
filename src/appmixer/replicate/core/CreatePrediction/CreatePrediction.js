'use strict';

module.exports = {
    async receive(context) {
        const { version, input, webhook, webhook_events_filter } = context.messages.in.content;

        if (!version) {
            throw new context.CancelError('Version is required');
        }

        if (!input) {
            throw new context.CancelError('Input is required');
        }

        // Parse input if it's a string (JSON)
        let parsedInput = input;
        if (typeof input === 'string') {
            try {
                parsedInput = JSON.parse(input);
            } catch (error) {
                throw new context.CancelError('Invalid input JSON format: ' + error.message);
            }
        }

        // Ensure we have a valid input object
        if (!parsedInput || typeof parsedInput !== 'object') {
            throw new context.CancelError('Input must be a valid object');
        }

        // Parse webhook_events_filter if it's a string
        let parsedWebhookEventsFilter = webhook_events_filter;
        if (typeof webhook_events_filter === 'string' && webhook_events_filter.trim()) {
            try {
                parsedWebhookEventsFilter = JSON.parse(webhook_events_filter);
            } catch (error) {
                throw new context.CancelError('Invalid webhook_events_filter JSON format: ' + error.message);
            }
        }

        // Build request data
        const requestData = {
            version,
            input: parsedInput
        };

        // Add optional webhook parameters if provided
        if (webhook && webhook.trim()) {
            requestData.webhook = webhook.trim();
        }

        if (parsedWebhookEventsFilter && Array.isArray(parsedWebhookEventsFilter)) {
            requestData.webhook_events_filter = parsedWebhookEventsFilter;
        }

        // https://replicate.com/docs/reference/http#predictions.create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.replicate.com/v1/predictions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
