'use strict';

module.exports = {

    async receive(context) {

        // https://resend.com/docs/api-reference/api-keys#list-api-keys
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/api-keys',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
