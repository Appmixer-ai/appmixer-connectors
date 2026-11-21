'use strict';

const lib = require('../../lib');
const SCHEMAS = require('../../schemas.json');

// Output contract of one item. Exported because the `out` port is dynamic.
const ITEM_SCHEMA = SCHEMAS.user;

// GET /api/users - https://developers.gorgias.com/reference/list-users
// One page of up to 100 items. Also the source of the users pickers: those calls
// (isSource) are cached and answer an empty list instead of an error.
module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Users' });
        }

        const params = { order_by: 'name:asc' };
        try {
            const { items } = context.properties.isSource
                ? await lib.listPageCached(context, '/users', params)
                : await lib.listPage(context, '/users', params);
            return lib.sendArrayOutput({ context, outputType, records: items });
        } catch (err) {
            if (context.properties.isSource) {
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
