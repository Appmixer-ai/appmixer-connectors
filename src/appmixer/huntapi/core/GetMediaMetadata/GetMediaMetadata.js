'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { url } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('Media URL is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/media/metadata',
            params: {
                query: url
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
