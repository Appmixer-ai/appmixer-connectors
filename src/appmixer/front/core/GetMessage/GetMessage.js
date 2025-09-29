
'use strict';

const lib = require('../../lib');
module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        // https://dev.frontapp.com/reference
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/messages/{id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
