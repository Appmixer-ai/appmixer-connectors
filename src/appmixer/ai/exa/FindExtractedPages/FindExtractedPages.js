'use strict';

const lib = require('../lib');

// Schema of a single extracted page as returned by /contents.
const schema = {
    'id': { 'type': 'string', 'title': 'Result ID', 'example': 'https://exa.ai/about' },
    'title': { 'type': 'string', 'title': 'Title', 'example': 'About Exa' },
    'url': { 'type': 'string', 'title': 'URL', 'example': 'https://exa.ai/about' },
    'publishedDate': { 'type': 'string', 'title': 'Published Date', 'example': '2024-11-08T00:00:00.000Z' },
    'author': { 'type': 'string', 'title': 'Author', 'example': 'Jane Doe' },
    'image': { 'type': 'string', 'title': 'Image URL', 'example': 'https://exa.ai/og-image.png' },
    'favicon': { 'type': 'string', 'title': 'Favicon URL', 'example': 'https://exa.ai/favicon.ico' },
    'text': { 'type': 'string', 'title': 'Page Text', 'example': 'Exa is a search engine built for AI.' },
    'summary': { 'type': 'string', 'title': 'Summary', 'example': 'Exa sells a web search API for AI agents.' },
    'highlights': {
        'type': 'array',
        'title': 'Highlights',
        'items': { 'type': 'string' },
        'example': ['Exa is a search engine built for AI applications.']
    }
};

module.exports = {

    async receive(context) {

        const {
            urls,
            includeText,
            includeHighlights,
            summaryQuery,
            maxAgeHours,
            subpages,
            subpageTarget,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Pages' });
        }

        const urlList = lib.toList(urls);
        if (!urlList) {
            throw new context.CancelError('URLs are required!');
        }

        const data = { urls: urlList };

        // /contents returns metadata only unless at least one content option is
        // asked for, so default to the full text when the user picked nothing.
        const contents = lib.buildContentsOptions({
            includeText: includeText === undefined ? true : includeText,
            includeHighlights,
            summaryQuery
        });
        Object.assign(data, contents);

        // maxAgeHours accepts 0 (force a fresh crawl) and -1 (cache only), so it
        // must be tested against undefined rather than for truthiness.
        if (maxAgeHours !== undefined && maxAgeHours !== null && maxAgeHours !== '') {
            data.maxAgeHours = maxAgeHours;
        }
        if (subpages) {
            data.subpages = subpages;

            const targets = lib.toList(subpageTarget);
            if (targets) {
                data.subpageTarget = targets;
            }
        }

        const response = await lib.makeRequest({ context, path: '/contents', data });
        const results = (response && response.results) || [];

        if (results.length === 0) {
            return context.sendJson({ urls: urlList }, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: results, outputType });
    }
};
