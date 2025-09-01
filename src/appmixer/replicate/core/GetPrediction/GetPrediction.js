'use strict';

module.exports = {
    async receive(context) {
        const { predictionId } = context.messages.in.content;

        if (!predictionId) {
            throw new context.CancelError('Prediction ID is required');
        }

        // https://replicate.com/docs/reference/http#predictions.get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.replicate.com/v1/predictions/${encodeURIComponent(predictionId)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
