
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { name } = context.messages.in.content;

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/v2/spaces/{name}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
