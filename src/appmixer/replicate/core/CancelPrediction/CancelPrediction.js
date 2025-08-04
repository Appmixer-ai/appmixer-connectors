
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { prediction_id } = context.messages.in.content;

        if (!prediction_id) {
            throw new context.CancelError('Prediction ID is required');
        }

        // https://replicate.com/docs/reference/http#predictions-cancel
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.replicate.com/v1/predictions/${prediction_id}/cancel`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
