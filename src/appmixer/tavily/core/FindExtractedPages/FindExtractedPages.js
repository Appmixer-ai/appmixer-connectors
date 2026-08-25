'use strict';

const lib = require('../../lib');

const MAX_URLS = 20;

// Schema of a single extracted page.
const schema = {
    'url': { 'type': 'string', 'title': 'URL' },
    'raw_content': { 'type': 'string', 'title': 'Content' },
    'images': { 'type': 'array', 'title': 'Images', 'items': { 'type': 'string' } },
    'favicon': { 'type': 'string', 'title': 'Favicon' }
};

module.exports = {
    async receive(context) {

        const {
            urls,
            extractDepth,
            format,
            query,
            includeImages,
            includeFavicon,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Pages' });
        }

        const urlList = lib.toList(urls);

        if (!urlList) {
            throw new context.CancelError('URLs is required!');
        }
        if (urlList.length > MAX_URLS) {
            throw new context.CancelError(
                `URLs accepts at most ${MAX_URLS} URLs per call, got ${urlList.length}.`
            );
        }

        const data = {
            urls: urlList,
            extract_depth: extractDepth || 'basic',
            format: format || 'markdown'
        };

        if (query) {
            data.query = query;
        }
        if (includeImages) {
            data.include_images = true;
        }
        if (includeFavicon) {
            data.include_favicon = true;
        }

        const response = await lib.makeRequest({ context, path: '/extract', data });
        const results = (response && response.results) || [];
        const failed = (response && response.failed_results) || [];

        // Nothing could be extracted — hand the caller the per-URL errors so the
        // failure is diagnosable instead of an empty result set.
        if (results.length === 0) {
            return context.sendJson({ failedResults: failed, count: failed.length }, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: results, outputType });
    }
};
