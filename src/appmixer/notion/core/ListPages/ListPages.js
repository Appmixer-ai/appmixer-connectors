'use strict';
const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'title', 'url', 'created_time', 'last_edited_time', 'parent'],
    properties: {
        id: { type: 'string', title: 'Page ID', example: 'b8c9d0e1-f2a3-4567-bcde-678901234567' },
        title: { type: 'string', title: 'Title', example: 'Launch plan' },
        url: {
            type: 'string',
            title: 'URL',
            example: 'https://app.notion.com/p/Launch-plan-b8c9d0e1f2a34567bcde678901234567'
        },
        public_url: {
            type: ['string', 'null'],
            title: 'Public URL',
            example: 'https://acme.notion.site/Launch-plan-b8c9d0e1f2a34567bcde678901234567'
        },
        created_time: { type: 'string', title: 'Created Time', example: '2025-12-01T08:00:00.000Z' },
        last_edited_time: { type: 'string', title: 'Last Edited Time', example: '2026-01-15T10:30:00.000Z' },
        parent: {
            type: 'object',
            title: 'Parent',
            required: ['type'],
            properties: {
                type: { type: 'string', title: 'Parent.Type', example: 'page_id' },
                page_id: {
                    type: 'string',
                    title: 'Parent.Page ID',
                    example: 'e5f6a7b8-c9d0-1234-efab-345678901234'
                },
                database_id: {
                    type: 'string',
                    title: 'Parent.Database ID',
                    example: '9b4c8f2e-1d3a-4e5b-8c7d-6f0a1b2c3d4e'
                },
                block_id: {
                    type: 'string',
                    title: 'Parent.Block ID',
                    example: '7a1d2c3b-4e5f-4a6b-9c8d-0e1f2a3b4c5d'
                },
                workspace: { type: 'boolean', title: 'Parent.Workspace', example: true }
            }
        }
    }
};

// The title lives in the property of type `title`. It is named `title` on a plain
// page, but carries the column's own name (e.g. `Name`) on a database item.
const getTitle = (page) => {
    const titleProperty = Object.values(page.properties || {}).find(property => property.type === 'title');
    const title = (titleProperty?.title || []).map(fragment => fragment.plain_text).join('');
    return title || 'Untitled';
};

const fetchPages = async (context) => {
    const { data } = await lib.callEndpoint(context, '/search', {
        method: 'POST',
        data: {
            filter: {
                value: 'page',
                property: 'object'
            },
            sort: {
                direction: 'descending',
                timestamp: 'last_edited_time'
            },
            page_size: 100
        }
    });

    return (data.results || []).map(page => ({
        id: page.id,
        title: getTitle(page),
        url: page.url,
        public_url: page.public_url,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        parent: page.parent
    }));
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {
        const { outputType } = context.messages.in?.content || {};
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Pages',
                value: 'result'
            });
        }

        if (!isSource) {
            const records = await fetchPages(context);
            return lib.sendArrayOutput({ context, outputType, records });
        }

        // Source call: backs a page dropdown in the inspector. Cached, and a failure
        // renders an empty dropdown rather than an error — the input is a typeahead,
        // so the ID can still be typed in.
        try {
            const result = await lib.withCache(context, ['ListPages'], async () => {
                const pages = await fetchPages(context);
                // Only the fields the dropdown needs, to keep the cache small.
                return pages.map(page => ({ id: page.id, title: page.title }));
            });
            return context.sendJson({ result }, 'out');
        } catch (err) {
            return context.sendJson({ result: [] }, 'out');
        }
    },

    pageToSelectArray({ result }) {
        return (result || []).map(page => {
            return { label: page.title, value: page.id };
        });
    }
};
