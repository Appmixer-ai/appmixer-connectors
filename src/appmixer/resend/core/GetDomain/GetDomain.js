'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Domain ID is required!');
        }

        // https://resend.com/docs/api-reference/domains#retrieve-domain
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.resend.com/domains/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
