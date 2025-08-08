'use strict';

module.exports = {
    async receive(context) {

        const { formId, subscriberId } = context.messages.in.content;

        // Validate required input
        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }

        if (!formId) {
            throw new context.CancelError('Form ID is required!');
        }

        // https://developers.kit.com/api-reference/forms/add-subscriber-to-form
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.kit.com/v4/forms/${formId}/subscribers/${subscriberId}`,
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            }
        });

        return context.sendJson(data.subscriber, 'out');
    }
};

