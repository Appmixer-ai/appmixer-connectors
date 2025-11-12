'use strict';

module.exports = {
    async receive(context) {
        const { phoneNumberId } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.vapi.ai/phone-number/${phoneNumberId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
