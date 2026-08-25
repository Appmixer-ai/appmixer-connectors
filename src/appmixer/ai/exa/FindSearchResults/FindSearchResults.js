'use strict';

const lib = require('../lib');

// Schema of a single Exa search result. Shared by the live path and the
// generateOutputPortOptions path so the designer always shows what is sent.
const schema = {
    'id': { 'type': 'string', 'title': 'Result ID', 'example': 'https://exa.ai/about' },
    'title': { 'type': 'string', 'title': 'Title', 'example': 'About Exa' },
    'url': { 'type': 'string', 'title': 'URL', 'example': 'https://exa.ai/about' },
    'publishedDate': { 'type': 'string', 'title': 'Published Date', 'example': '2024-11-08T00:00:00.000Z' },
    'author': { 'type': 'string', 'title': 'Author', 'example': 'Jane Doe' },
    'score': { 'type': 'number', 'title': 'Relevance Score', 'example': 0.86 },
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
            query,
            searchType,
            numResults,
            category,
            includeDomains,
            excludeDomains,
            startPublishedDate,
            endPublishedDate,
            userLocation,
            includeText,
            includeHighlights,
            summaryQuery,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Results' });
        }

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        const data = {
            query,
            type: searchType || 'auto'
        };

        if (numResults) {
            data.numResults = numResults;
        }
        if (category) {
            data.category = category;
        }
        if (userLocation) {
            data.userLocation = userLocation;
        }
        // The date picker can hand us a full ISO timestamp; the API accepts ISO
        // 8601 but the date-only form is what the inspector actually collects.
        if (startPublishedDate) {
            data.startPublishedDate = String(startPublishedDate).slice(0, 10);
        }
        if (endPublishedDate) {
            data.endPublishedDate = String(endPublishedDate).slice(0, 10);
        }

        const include = lib.toList(includeDomains);
        if (include) {
            data.includeDomains = include;
        }
        const exclude = lib.toList(excludeDomains);
        if (exclude) {
            data.excludeDomains = exclude;
        }

        const contents = lib.buildContentsOptions({ includeText, includeHighlights, summaryQuery });
        if (contents) {
            data.contents = contents;
        }

        const response = await lib.makeRequest({ context, path: '/search', data });
        const results = (response && response.results) || [];

        if (results.length === 0) {
            return context.sendJson({ query }, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: results, outputType });
    }
};
