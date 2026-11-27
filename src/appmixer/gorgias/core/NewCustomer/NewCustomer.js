'use strict';

const lib = require('../../lib');

/**
 * The newest page of customers (up to 100), newest first.
 * @returns {Promise<{customers: object[], truncated: boolean}>}
 */
const fetchNewestCustomers = async (context, limit = lib.PAGE_SIZE) => {

    const { items, nextCursor } = await lib.listPage(context, '/customers', {
        order_by: 'created_datetime:desc',
        limit
    });
    return { customers: items, truncated: !!nextCursor };
};

// Polling trigger: GET /api/customers ordered by created_datetime:desc
// (https://developers.gorgias.com/reference/list-customers). The first tick records the customers
// that exist; later ticks emit the ones that were not seen before.
module.exports = {

    fetchNewestCustomers,

    async tick(context) {

        const { customers, truncated } = await fetchNewestCustomers(context);
        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;

        // A degraded answer (empty while customers are known) must not become the state: the next
        // tick would fire the whole page again.
        if (known && known.size && !customers.length) {
            return;
        }

        if (known) {
            // An unseen customer no newer than the floor was pulled onto a full page by a deletion;
            // it is not new.
            const { floor } = context.state;
            const fresh = customers.filter(customer => !known.has(customer.id)
                && (!floor || !customer.created_datetime || customer.created_datetime > floor));
            // Oldest first, the order they were created in.
            for (const customer of fresh.reverse()) {
                await context.sendJson(customer, 'out');
            }
        }

        const oldest = customers[customers.length - 1];
        await context.saveState({
            known: customers.map(customer => customer.id),
            floor: oldest && truncated ? oldest.created_datetime || null : null
        });
    },

    // Flow Test Mode: the newest customer, read the same way tick() reads them.
    async test(context) {

        const { customers } = await fetchNewestCustomers(context, 1);
        if (!customers.length) {
            throw new context.CancelError('There is no customer in this Gorgias account yet. Create one and test again.');
        }
        return context.sendJson(customers[0], 'out');
    }
};
