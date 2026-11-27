'use strict';

const lib = require('../../lib');

// GET /api/views - https://developers.gorgias.com/reference/list-views
// Private source of the view pickers: one page of up to 100 views, newest first.
// Picker calls (isSource) are cached and answer an empty list instead of an error.
module.exports = {

    async receive(context) {

        const params = { order_by: 'created_datetime:desc' };
        try {
            const { items } = context.properties.isSource
                ? await lib.listPageCached(context, '/views', params)
                : await lib.listPage(context, '/views', params);
            return context.sendJson({ result: items, count: items.length }, 'out');
        } catch (err) {
            if (context.properties.isSource) {
                await context.log({ step: 'view picker source failed', error: err.message });
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }
    },

    toSelectArray(msg) {

        const items = (msg && msg.result) || [];
        return items.map(item => ({ label: item.name || String(item.id), value: String(item.id) }));
    }
};
