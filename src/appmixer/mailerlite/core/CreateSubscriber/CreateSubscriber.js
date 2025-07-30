
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { email, name, groups } = context.messages.in.content;

        // https://developers.mailerlite.com/docs/#subscribers
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/api/subscribers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
