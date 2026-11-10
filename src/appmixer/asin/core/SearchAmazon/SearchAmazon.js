'use strict';

const lib = require('../../lib');

// The output contract of one item.
const ITEM_SCHEMA = {
    type: 'object',
    properties: {
        asin: {
            type: 'string',
            title: 'ASIN',
            example: 'B0CZY1LRT4'
        },
        title: {
            type: 'string',
            title: 'Title',
            example: 'Kindle'
        },
        image: {
            type: 'string',
            title: 'Image',
            example: 'https://m.media-amazon.com/x.jpg'
        },
        price: {
            type: 'number',
            title: 'Price',
            example: 177.99
        },
        currency: {
            type: 'string',
            title: 'Currency',
            example: 'USD'
        },
        rating: {
            type: 'number',
            title: 'Rating',
            example: 4.5
        },
        reviews_count: {
            type: 'integer',
            title: 'Reviews Count',
            example: 2377
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { query, marketplace, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Amazon Results' });
        }

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/api/v1/search',
            params: {
                query: query,
                marketplace: marketplace || 'com'
            }
        });

        const items = (response && response.results) || [];
        const records = items
            .filter(item => item && item.asin)
            .map(item => Object.fromEntries(
                Object.keys(ITEM_SCHEMA.properties).map(name => [name, item[name]])
            ));

        if (records.length === 0) {
            return context.sendJson({ query }, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
