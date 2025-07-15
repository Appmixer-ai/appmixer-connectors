
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { resource, method, body } = context.messages.in.content;

        // https://www.figma.com/developers/api
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.figma.com/v1/{resource}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
