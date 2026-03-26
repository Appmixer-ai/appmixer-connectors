'use strict';

module.exports = {

    async receive(context) {

        const { conversionKey } = context.messages.in.content;

        if (!conversionKey) {
            throw new context.CancelError('Conversion Key is required!');
        }

        const baseUrl = context.auth.baseUrl.replace(/\/$/, '');
        await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/Flows/Home/HubsStart?clientKey=${encodeURIComponent(context.auth.clientKey)}&conversionKey=${encodeURIComponent(conversionKey)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.token}`
            }
        });

        return context.sendJson({ conversionKey }, 'out');
    }
};
