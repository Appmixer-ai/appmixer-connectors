
'use strict';

module.exports = {
    async receive(context) {

        const { modelOwner, modelName } = context.messages.in.content;

        if (!modelOwner || !modelName) {
            throw new context.CancelError('Model owner and model name are required');
        }

        // https://replicate.com/docs/reference/http#models.get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.replicate.com/v1/models/${encodeURIComponent(modelOwner)}/${encodeURIComponent(modelName)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
