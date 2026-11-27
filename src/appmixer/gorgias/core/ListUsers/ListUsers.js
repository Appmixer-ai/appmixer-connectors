'use strict';

const lib = require('../../lib');

// GET /api/users - https://developers.gorgias.com/reference/list-users
// Private source of the assignee pickers: one page of up to 100 users (agents), sorted by name.
// Picker calls (isSource) are cached and answer an empty list instead of an error.
module.exports = {

    async receive(context) {

        const params = { order_by: 'name:asc' };
        try {
            const { items } = context.properties.isSource
                ? await lib.listPageCached(context, '/users', params)
                : await lib.listPage(context, '/users', params);
            return context.sendJson({ result: items, count: items.length }, 'out');
        } catch (err) {
            if (context.properties.isSource) {
                await context.log({ step: 'assignee picker source failed', error: err.message });
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }
    },

    toSelectArray(msg) {

        const items = (msg && msg.result) || [];
        return items.map(item => ({ label: item.name ? `${item.name} (${item.email})` : item.email, value: String(item.id) }));
    }
};
