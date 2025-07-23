
'use strict';

module.exports = {
    async receive(context) {

        // https://resend.com/docs/api-reference/domains#list-domains
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/domains',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
