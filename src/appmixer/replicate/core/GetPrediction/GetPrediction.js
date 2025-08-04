
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { prediction_id } = context.messages.in.content;

        // https://replicate.com/docs/reference/http#predictions
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.replicate.com/v1/predictions/${prediction_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
