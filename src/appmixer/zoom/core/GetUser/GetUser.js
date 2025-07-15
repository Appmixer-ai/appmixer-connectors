
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { userId = 'me' } = context.messages.in.content;

        // https://marketplace.zoom.us/docs/api-reference/zoom-api/users/user
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.zoom.us/v2/users/${userId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};
