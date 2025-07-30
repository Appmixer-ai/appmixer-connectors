
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { subscriber_id } = context.messages.in.content;

        // https://developers.mailerlite.com/docs/#subscribers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/api/subscribers/{subscriber_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
