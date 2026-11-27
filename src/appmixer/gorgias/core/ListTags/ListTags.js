'use strict';

const lib = require('../../lib');
const SCHEMAS = require('../../schemas.json');

// Output contract of one item. Exported because the `out` port is dynamic.
const ITEM_SCHEMA = SCHEMAS.tag;

// GET /api/tags - https://developers.gorgias.com/reference/list-tags
// All items: follows the cursor up to lib.MAX_LIST_ITEMS. Also the source of the tags pickers: those calls
// (isSource) are cached and answer an empty list instead of an error.
module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Tags' });
        }

        const params = { order_by: 'created_datetime:desc' };
        try {
            const { items } = context.properties.isSource
                ? await lib.listAllCached(context, '/tags', params)
                : await lib.listAll(context, '/tags', params);
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
        return items.map(item => ({ label: item.name, value: item.name }));
    }
};
