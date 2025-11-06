
'use strict';

const lib = require('../../lib');
module.exports = {
    async receive(context) {

        const { model } = context.messages.in.content;

        // https://docs.x.ai/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/https://api.x.ai/v1/fingerprint',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
