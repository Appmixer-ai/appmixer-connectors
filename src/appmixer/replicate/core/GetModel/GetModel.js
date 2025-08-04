
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { model_owner, model_name } = context.messages.in.content;

        // https://replicate.com/docs/reference/http#models
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.replicate.com/v1/models/${model_owner}/${model_name}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
