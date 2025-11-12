'use strict';

module.exports = {

    async receive(context) {

        const { chunkId } = context.messages.in.content;

        if (!chunkId) {
            throw new context.CancelError('Chunk ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.ragie.ai/chunks/${chunkId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};
