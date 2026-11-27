'use strict';

const lib = require('../lib');

// The Hub search endpoint caps a single page at 100 items. Appmixer does not
// expose limit/offset inputs on Find components, so we always ask for the
// maximum page and return it.
const PAGE_SIZE = 100;

// The output contract of ONE dataset record. The out port is dynamic, so this is
// the only place the contract exists; it backs both the live path and the
// generateOutputPortOptions path so the designer shows exactly what is sent.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'author', 'url'],
    properties: {
        id: { type: 'string', title: 'Dataset ID', example: 'rajpurkar/squad' },
        author: { type: 'string', title: 'Author', example: 'rajpurkar' },
        description: {
            type: 'string',
            title: 'Description',
            example: 'Stanford Question Answering Dataset (SQuAD) is a reading comprehension dataset.'
        },
        downloads: { type: 'integer', title: 'Downloads (last 30 days)', example: 152282 },
        likes: { type: 'integer', title: 'Likes', example: 892 },
        trendingScore: { type: 'number', title: 'Trending Score', example: 3 },
        private: { type: 'boolean', title: 'Private', example: false },
        gated: { type: 'string', title: 'Gated', example: 'none' },
        disabled: { type: 'boolean', title: 'Disabled', example: false },
        tags: {
            type: 'array',
            title: 'Tags',
            items: { type: 'string' },
            example: ['task_categories:question-answering', 'language:en', 'license:cc-by-sa-4.0']
        },
        createdAt: {
            type: 'string',
            format: 'date-time',
            title: 'Created At',
            example: '2022-03-02T23:29:22.000Z'
        },
        lastModified: {
            type: 'string',
            format: 'date-time',
            title: 'Last Modified',
            example: '2024-03-04T13:54:37.000Z'
        },
        url: {
            type: 'string',
            title: 'Dataset URL',
            example: 'https://huggingface.co/datasets/rajpurkar/squad'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            search,
            author,
            filter,
            sort,
            direction,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Datasets' });
        }

        // The Hub takes `filter` as a REPEATED query parameter (filter=a&filter=b).
        // The default axios serializer would emit `filter[]=a&filter[]=b`, which the
        // Hub does not recognise, so the query string is built by hand here.
        const query = new URLSearchParams();
        query.append('limit', String(PAGE_SIZE));

        if (search) {
            query.append('search', search);
        }
        if (author) {
            query.append('author', author);
        }

        for (const tag of lib.toList(filter) || []) {
            query.append('filter', tag);
        }

        if (sort) {
            query.append('sort', sort);
            // The Hub expects direction=-1 for descending; ascending is the default.
            if (direction !== 'asc') {
                query.append('direction', '-1');
            }
        }

        const datasets = await lib.makeRequest({ context, path: `/api/datasets?${query.toString()}` });

        const records = (Array.isArray(datasets) ? datasets : []).map(dataset => {
            const id = dataset.id;
            return {
                id,
                author: dataset.author || String(id || '').split('/')[0],
                description: typeof dataset.description === 'string' ? dataset.description.trim() : null,
                downloads: dataset.downloads || 0,
                likes: dataset.likes || 0,
                trendingScore: dataset.trendingScore || 0,
                private: Boolean(dataset.private),
                gated: lib.normalizeGated(dataset.gated),
                disabled: Boolean(dataset.disabled),
                tags: dataset.tags || [],
                createdAt: dataset.createdAt || null,
                lastModified: dataset.lastModified || null,
                url: `${lib.HUB_API_BASE_URL}/datasets/${id}`
            };
        });

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
