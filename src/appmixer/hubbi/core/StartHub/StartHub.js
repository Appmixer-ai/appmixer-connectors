'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { conversionKey } = context.messages.in.content;

        if (!conversionKey) {
            throw new context.CancelError('Hub is required!');
        }

        const baseUrl = context.auth.baseUrl.replace(/\/$/, '');
        try {
            await context.httpRequest({
                method: 'GET',
                url: `${baseUrl}/Flows/Home/HubsStart?clientKey=${encodeURIComponent(context.auth.clientKey)}&conversionKey=${encodeURIComponent(conversionKey)}`,
                headers: {
                    'Authorization': `Bearer ${context.auth.token}`
                }
            });
        } catch (err) {
            lib.rethrowHubbiError(context, err);
        }

        return context.sendJson({ conversionKey }, 'out');
    }
};
