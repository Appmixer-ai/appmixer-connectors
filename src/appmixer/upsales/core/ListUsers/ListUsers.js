'use strict';

const lib = require('../../lib');

module.exports = {

    // https://api.upsales.com/ - GET /users (one page, maximum page size)
    async receive(context) {

        const query = { limit: lib.MAX_PAGE_SIZE };
        try {
            const { items } = context.properties.isSource
                ? await lib.listCached(context, '/users', query)
                : await lib.list(context, '/users', query);
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
            label: item.name || item.email || String(item.id),
            value: String(item.id)
        }));
    }
};
