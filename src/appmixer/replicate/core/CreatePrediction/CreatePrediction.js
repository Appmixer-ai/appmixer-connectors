'use strict';

module.exports = {
    async receive(context) {

        const {
            version,
            input,
            webhook,
            webhookEventsFilter = []
        } = context.messages.in.content;

        if (!version) {
            throw new context.CancelError('Version is required');
        }

        if (!input) {
            throw new context.CancelError('Input is required');
        }

        // Parse input JSON string
        let inputObject;
        try {
            inputObject = JSON.parse(input);
        } catch (error) {
            throw new context.CancelError('Invalid input JSON format. Please provide a valid JSON object. Example: {"prompt": "Hello world"}');
        }

        // Construct request data and endpoint
        let url;
        const isOfficialModel = version.includes('/') && !version.includes(':') && !version.match(/^[a-f0-9]{64}$/);

        if (isOfficialModel) {
            const [owner, model] = version.split('/');
            if (!owner || !model) {
                throw new context.CancelError('Invalid official model format. Expected "owner/model"');
            }

            url = `https://api.replicate.com/v1/models/${owner}/${model}/predictions`;
        } else {
            url = 'https://api.replicate.com/v1/predictions';
        }

        const requestData = {
            input: inputObject,
            ...(isOfficialModel ? {} : { version }),
            ...(webhook?.trim() && { webhook: webhook.trim() }),
            ...(Array.isArray(webhookEventsFilter) && webhookEventsFilter.length > 0 && {
                webhook_events_filter: webhookEventsFilter
            })
        };

        // Send request
        const { data } = await context.httpRequest({
            method: 'POST',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
