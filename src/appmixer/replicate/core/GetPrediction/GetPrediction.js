'use strict';

module.exports = {
    async receive(context) {
        const { prediction_id } = context.messages.in.content;

        if (!prediction_id) {
            throw new context.CancelError('Prediction ID is required');
        }

        // https://replicate.com/docs/reference/http#predictions.get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.replicate.com/v1/predictions/${encodeURIComponent(prediction_id)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};
