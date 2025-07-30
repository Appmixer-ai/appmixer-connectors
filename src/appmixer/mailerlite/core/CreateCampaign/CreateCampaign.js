
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { name, subject, content, groups } = context.messages.in.content;

        // https://developers.mailerlite.com/docs/#campaigns-create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/api/campaigns',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
