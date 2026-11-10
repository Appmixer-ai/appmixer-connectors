'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { url, engine } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('URL is required!');
        }

        const engineValue = engine || 'crawler';
        if (!['crawler', 'rendering', 'webunlocker'].includes(engineValue)) {
            throw new context.CancelError('Engine must be one of: crawler, rendering, webunlocker.');
        }

        const response = await lib.makeRequest({
            context,
            path: `/v2/website/${engineValue}`,
            params: {
                query: url
            }
        });

        // The page comes back as a JSON string holding the HTML.
        return context.sendJson({
            url: url,
            engine: engineValue,
            html: typeof response === 'string' ? response : JSON.stringify(response)
        }, 'out');
    }
};
