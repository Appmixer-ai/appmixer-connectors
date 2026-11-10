'use strict';

const lib = require('../../lib');

// The output contract of one item.
const ITEM_SCHEMA = {
    type: 'object',
    properties: {
        position: {
            type: 'integer',
            title: 'Position',
            example: 1
        },
        title: {
            type: 'string',
            title: 'Title',
            example: 'Markets rally'
        },
        link: {
            type: 'string',
            title: 'Link',
            example: 'https://news.example.com/a'
        },
        source: {
            type: 'string',
            title: 'Source',
            example: 'Example News'
        },
        snippet: {
            type: 'string',
            title: 'Snippet',
            example: 'Stocks rose on Monday.'
        },
        date: {
            type: 'string',
            title: 'Date',
            example: '2 hours ago'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { query, country, language, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Google News Results' });
        }

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/google/news',
            params: {
                query: query,
                gl: country || 'us',
                hl: language
            }
        });

        const items = (response && response.organic_results) || [];
        const records = items
            .filter(item => item && typeof item.link === 'string' && /^https?:\/\//.test(item.link))
            .map(item => Object.fromEntries(
                Object.keys(ITEM_SCHEMA.properties).map(name => [name, item[name]])
            ));

        if (records.length === 0) {
            return context.sendJson({ query }, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
