'use strict';

const lib = require('../../lib');

// Schema of a single crawled page.
const schema = {
    'url': { 'type': 'string', 'title': 'URL' },
    'raw_content': { 'type': 'string', 'title': 'Content' },
    'favicon': { 'type': 'string', 'title': 'Favicon' }
};

module.exports = {
    async receive(context) {

        const {
            url,
            instructions,
            maxDepth,
            maxBreadth,
            maxPages,
            selectPaths,
            excludePaths,
            selectDomains,
            excludeDomains,
            allowExternal,
            extractDepth,
            format,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Pages' });
        }

        if (!url) {
            throw new context.CancelError('URL is required!');
        }

        const data = {
            url,
            extract_depth: extractDepth || 'basic',
            format: format || 'markdown'
        };

        if (instructions) {
            data.instructions = instructions;
        }
        if (maxDepth) {
            data.max_depth = maxDepth;
        }
        if (maxBreadth) {
            data.max_breadth = maxBreadth;
        }
        if (maxPages) {
            data.limit = maxPages;
        }
        // allowExternal defaults to true upstream, so only send it when the user
        // explicitly turned it off.
        if (allowExternal === false) {
            data.allow_external = false;
        }

        const listInputs = {
            select_paths: selectPaths,
            exclude_paths: excludePaths,
            select_domains: selectDomains,
            exclude_domains: excludeDomains
        };
        Object.keys(listInputs).forEach(key => {
            const value = lib.toList(listInputs[key]);
            if (value) {
                data[key] = value;
            }
        });

        const response = await lib.makeRequest({ context, path: '/crawl', data });
        const results = (response && response.results) || [];

        if (results.length === 0) {
            return context.sendJson({ url }, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: results, outputType });
    }
};
