'use strict';

const lib = require('../../lib');
const SCHEMAS = require('../../schemas.json');

// Output contract of one customer. Exported because the `out` port is dynamic.
const ITEM_SCHEMA = SCHEMAS.customer;

// GET /api/customers - https://developers.gorgias.com/reference/list-customers
// All matching customers, newest first: follows the cursor up to lib.MAX_LIST_ITEMS.
module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { email, name, externalId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Customers' });
        }

        const params = lib.compact({
            order_by: 'created_datetime:desc',
            email,
            name,
            external_id: externalId
        });

        const { items } = await lib.listAll(context, '/customers', params);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
