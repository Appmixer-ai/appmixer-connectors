'use strict';

const lib = require('../../lib');

// The output contract of one organic result. cloro always returns position, title and
// link for a resolved result; the other fields depend on the result.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['position', 'title', 'link'],
    properties: {
        position: { type: 'integer', title: 'Position', example: 1 },
        title: { type: 'string', title: 'Title', example: 'Example Domain' },
        link: { type: 'string', title: 'Link', example: 'https://example.com/' },
        displayedLink: { type: 'string', title: 'Displayed Link', example: 'https://example.com' },
        snippet: { type: 'string', title: 'Snippet', example: 'This domain is for use in documentation examples.' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { query, country, aiOverview, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Results' });
        }

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        if (lib.encodedPromptLength(query) > lib.BING_PROMPT_LIMIT) {
            throw new context.CancelError(
                'The query is too long for Bing: the limit is 3,500 characters after URL encoding, ' +
                'and non-Latin scripts allow fewer characters.'
            );
        }

        const data = {
            query,
            country: (country || 'US').trim().toUpperCase()
        };
        if (aiOverview) {
            data.include = { aioverview: { markdown: true } };
        }

        const response = await lib.makeRequest({ context, path: '/v1/monitor/bing', data });
        const result = (response && response.result) || {};

        // Bing does not show an AI Overview for every query. When it shows one, it goes to
        // its own port, before the organic results.
        if (aiOverview && result.aioverview) {
            await context.sendJson({
                query,
                text: result.aioverview.text,
                markdown: result.aioverview.markdown,
                sources: (result.aioverview.sources || []).map(source => ({
                    position: source.position,
                    label: source.label,
                    url: source.url,
                    description: source.description
                }))
            }, 'aiOverview');
        }

        // Skip a row that has no resolved link, as Find Google Results does.
        const results = (result.organicResults || [])
            .filter(item => item && typeof item.link === 'string' && /^https?:\/\//.test(item.link))
            .map(item => ({
                position: item.position,
                title: item.title,
                link: item.link,
                displayedLink: item.displayedLink,
                snippet: item.snippet
            }));

        if (results.length === 0) {
            return context.sendJson({ query }, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: results, outputType });
    }
};
