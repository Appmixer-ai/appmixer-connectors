'use strict';

module.exports = {
    async receive(context) {
        const { phoneNumberId, customerId, assistantId, squadId } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }

        if (!assistantId) {
            throw new context.CancelError('Assistant ID is required!');
        }

        const payload = {
            phoneNumberId,
            customerId,
            assistantId
        };

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
