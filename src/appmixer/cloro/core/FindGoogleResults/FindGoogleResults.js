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
        snippet: { type: 'string', title: 'Snippet', example: 'This domain is for use in documentation examples.' },
        date: { type: 'string', title: 'Date', example: '2 days ago' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { query, country, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Results' });
        }

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        const data = {
            query,
            country: (country || 'US').trim().toUpperCase()
        };

        const response = await lib.makeRequest({ context, path: '/v1/monitor/google', data });
        const organic = (response && response.result && response.result.organicResults) || [];

        // cloro sends an empty link when it has not resolved the destination yet. Such a
        // row is not useful downstream, so it is skipped.
        const results = organic
            .filter(item => item && typeof item.link === 'string' && /^https?:\/\//.test(item.link))
            .map(item => ({
                position: item.position,
                title: item.title,
                link: item.link,
                displayedLink: item.displayedLink,
                snippet: item.snippet,
                date: item.date
            }));

        if (results.length === 0) {
            return context.sendJson({ query }, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: results, outputType });
    }
};
