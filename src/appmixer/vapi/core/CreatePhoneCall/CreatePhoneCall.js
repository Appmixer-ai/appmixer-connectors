'use strict';

module.exports = {
    async receive(context) {
        const { phoneNumberId, customerId, assistantId, squadId } = context.messages.in.content;

        const payload = {};

        if (phoneNumberId) {
            payload.phoneNumberId = phoneNumberId;
        }

        if (customerId) {
            payload.customerId = customerId;
        }

        if (assistantId) {
            payload.assistantId = assistantId;
        }

        if (squadId) {
            payload.squadId = squadId;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.vapi.ai/call/phone',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
