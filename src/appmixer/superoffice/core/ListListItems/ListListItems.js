'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'integer', title: 'Item ID', example: 3 },
        name: { type: 'string', title: 'Name', example: 'Customer' },
        fullName: { type: 'string', title: 'Full Name', example: 'Customers/Customer' },
        tooltip: { type: 'string', title: 'Tooltip', example: 'Existing customer' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;
        // Dropdowns of other components name the list in the source properties.
        const listName = context.messages.in.content.listName || context.properties.listName;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Items', value: 'result' });
        }

        if (!listName) {
            throw new context.CancelError('List is required!');
        }

        let items;
        try {
            items = isSource
                ? await lib.callCached(context, { op: 'listItems', listName }, () => lib.listItems(context, listName))
                : await lib.listItems(context, listName);
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records: items });
    },

    toSelectArray({ result }) {

        return (result || []).map(item => ({
            label: item.fullName || item.name,
            value: String(item.id)
        }));
    }
};
