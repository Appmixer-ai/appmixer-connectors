
'use strict';

module.exports = {
    async receive(context) {

        const { domain } = context.messages.in.content;

        if (!domain) {
            throw new context.CancelError('Domain name is required!');
        }

        // https://resend.com/docs/api-reference/domains#create-domain
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/domains',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                name: domain
            }
        });

        return context.sendJson(data, 'out');
    }
};
