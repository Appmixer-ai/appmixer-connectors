'use strict';

module.exports = {
    async receive(context) {
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.vapi.ai/assistant',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const assistants = Array.isArray(data) ? data : [];

        // Transform assistants to options format for dynamic field selection
        const options = assistants.map(assistant => ({
            label: assistant.name || assistant.id,
            value: assistant.id
        }));

        return context.sendJson(options, 'out');
    }
};
