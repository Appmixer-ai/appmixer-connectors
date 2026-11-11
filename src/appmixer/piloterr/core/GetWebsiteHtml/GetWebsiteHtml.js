'use strict';

const lib = require('../../lib');

const ENGINES = ['crawler', 'rendering', 'webunlocker'];

module.exports = {

    async receive(context) {

        const { url, engine, saveAsFile } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('URL is required!');
        }

        const engineValue = engine || 'crawler';
        if (!ENGINES.includes(engineValue)) {
            throw new context.CancelError('Engine must be one of: crawler, rendering, webunlocker.');
        }

        const response = await lib.makeRequest({
            context,
            path: `/v2/website/${engineValue}`,
            params: {
                query: url
            }
        });

        // The page comes back as a JSON string holding the HTML. Anything else is
        // an unexpected answer, not a page, so it must not end up in the HTML field.
        if (typeof response !== 'string') {
            throw new context.CancelError('Piloterr returned an unexpected response: expected the page HTML as a string.');
        }

        if (saveAsFile) {
            // Rendered pages can weigh several MB: store them as a file and pass the file ID on.
            const buffer = Buffer.from(response, 'utf8');
            const filename = `piloterr-${engineValue}-${Date.now()}.html`;
            const file = await context.saveFileStream(filename, buffer);
            return context.sendJson({
                url,
                engine: engineValue,
                fileId: file.fileId,
                filename,
                fileSize: buffer.length
            }, 'out');
        }

        return context.sendJson({ url, engine: engineValue, html: response }, 'out');
    }
};
