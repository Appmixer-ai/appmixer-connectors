'use strict';

const lib = require('../../lib');

module.exports = {

    // https://api.upsales.com/ - GET /products (one page, maximum page size)
    async receive(context) {

        const query = { active: 1, limit: lib.MAX_PAGE_SIZE };
        try {
            const { items } = context.properties.isSource
                ? await lib.listCached(context, '/products', query)
                : await lib.list(context, '/products', query);
            return context.sendJson({ items }, 'out');
        } catch (err) {
            if (context.properties.isSource) {
                return context.sendJson({ items: [] }, 'out');
            }
            throw err;
        }
    },

    toSelectArray({ items }) {

        return (items || []).map(item => ({
            label: item.name,
            value: String(item.id)
        }));
    }
};
