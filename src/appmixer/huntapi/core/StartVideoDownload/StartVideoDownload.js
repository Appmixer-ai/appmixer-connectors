'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { url, videoQuality, videoFormat } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('Video URL is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/video/download',
            params: {
                query: url,
                video_quality: videoQuality,
                video_format: videoFormat
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
