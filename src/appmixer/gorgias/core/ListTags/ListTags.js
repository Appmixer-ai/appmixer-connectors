'use strict';

const lib = require('../../lib');

// GET /api/tags - https://developers.gorgias.com/reference/list-tags
// Private source of the tags pickers: one page of up to 100 tags, newest first.
// Picker calls (isSource) are cached and answer an empty list instead of an error.
module.exports = {

    async receive(context) {

        const params = { order_by: 'created_datetime:desc' };
        try {
            const { items } = context.properties.isSource
                ? await lib.listPageCached(context, '/tags', params)
                : await lib.listPage(context, '/tags', params);
            return context.sendJson({ result: items, count: items.length }, 'out');
        } catch (err) {
            if (context.properties.isSource) {
                await context.log({ step: 'tags picker source failed', error: err.message });
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }
    },

    toSelectArray(msg) {

        const items = (msg && msg.result) || [];
        return items.map(item => ({ label: item.name, value: item.name }));
    }
};
