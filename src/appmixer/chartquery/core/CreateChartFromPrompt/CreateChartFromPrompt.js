'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { prompt, rawData } = context.messages.in.content;

        if (!prompt) {
            throw new context.CancelError('Prompt is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/chart/ai',
            params: {
                prompt: prompt,
                raw_data: rawData,
                share: 'true'
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
