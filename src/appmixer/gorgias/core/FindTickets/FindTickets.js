'use strict';

const lib = require('../../lib');
const SCHEMAS = require('../../schemas.json');

// Output contract of one ticket. Exported because the `out` port is dynamic.
const ITEM_SCHEMA = SCHEMAS.ticket;

// GET /api/tickets - https://developers.gorgias.com/reference/list-tickets
// All matching tickets, newest first: follows the cursor up to lib.MAX_LIST_ITEMS. The endpoint includes trashed tickets unless
// trashed=false is sent.
module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { customerId, viewId, externalId, includeTrashed, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Tickets' });
        }

        const params = {
            order_by: 'created_datetime:desc',
            trashed: includeTrashed === true
        };
        const customer = lib.optionalId(context, customerId, 'Customer ID');
        if (customer) {
            params.customer_id = customer;
        }
        const view = lib.optionalId(context, viewId, 'View');
        if (view) {
            params.view_id = view;
        }
        if (externalId) {
            params.external_id = externalId;
        }

        const { items } = await lib.listAll(context, '/tickets', params);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
