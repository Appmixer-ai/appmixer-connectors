'use strict';

const lib = require('../../lib');

// The output contract of ONE service item. The out port is dynamic, so this is where the contract lives.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'display_id', 'name'],
    properties: {
        id: { type: 'integer', title: 'Service Item ID', example: 1003341991 },
        display_id: { type: 'integer', title: 'Display ID', example: 1 },
        name: { type: 'string', title: 'Name', example: 'Office Desktop' },
        short_description: { type: 'string', title: 'Short Description', example: 'A desktop computer for office work' },
        description: {
            type: 'string',
            title: 'Description (HTML)',
            example: '<div>Standard office desktop with monitor.</div>'
        },
        category_id: { type: 'integer', title: 'Category ID', example: 811100 },
        delivery_time: { type: 'integer', title: 'Delivery Time (hours)', example: 48 },
        cost: { type: 'string', title: 'Cost', example: '1200.00' },
        allow_quantity: { type: 'boolean', title: 'Allow Quantity', example: true },
        is_bundle: { type: 'boolean', title: 'Is Bundle', example: false },
        visibility: { type: 'integer', title: 'Visibility', example: 2 },
        workspace_id: { type: 'integer', title: 'Workspace ID', example: 2 },
        created_at: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-05-02T08:54:14Z' },
        updated_at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-18T10:06:20Z' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { categoryId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Service Items' });
        }

        try {
            const params = lib.compact({ category_id: lib.optionalId(context, categoryId, 'Category ID') });
            // The catalog serves at most 30 items a page.
            const fetch = () => lib.listPages(context, '/service_catalog/items', 'service_items', params, {
                pageSize: lib.CATALOG_PAGE_SIZE
            });
            // Called from the Place Service Request inspector: cached, the designer calls it in bursts.
            const items = context.properties.isSource
                ? await lib.cached(context, { path: '/service_catalog/items', params }, fetch)
                : await fetch();

            return await lib.sendArrayOutput({ context, outputType, records: items.map(lib.withoutNulls) });
        } catch (err) {
            if (context.properties.isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }
    },

    toSelectArray(msg) {

        const items = (msg && msg.result) || [];
        return items.map(item => ({ label: item.name, value: String(item.display_id) }));
    }
};
