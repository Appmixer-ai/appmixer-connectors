'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { url, audioFormat } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('Media URL is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/audio/download',
            params: {
                query: url,
                audio_format: audioFormat
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
