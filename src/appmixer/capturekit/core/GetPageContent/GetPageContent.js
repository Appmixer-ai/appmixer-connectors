'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { url, mainContentOnly } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('URL is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/content',
            params: {
                url: url,
                use_defuddle: mainContentOnly || 'true',
                include_markdown: 'true',
                remove_cookie_banners: 'true'
            }
        });

        return context.sendJson((response && response.data) || {}, 'out');
    }
};
