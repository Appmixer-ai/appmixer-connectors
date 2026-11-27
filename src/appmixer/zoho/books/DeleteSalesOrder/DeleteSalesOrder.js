'use strict';
const ZohoClient = require('../../ZohoClient');

/**
 * Delete a sales order: DELETE /salesorders/{salesorder_id}.
 * @see https://www.zoho.com/books/api/v3/salesorders/#delete-a-sales-order
 */
module.exports = {

    async receive(context) {

        const { organizationId, salesOrderId } = context.messages.in.content;

        if (!salesOrderId) {
            throw new context.CancelError('Sales Order ID is required!');
        }

        const zc = new ZohoClient(context);
        await zc.request(
            'DELETE',
            '/books/v3/salesorders/' + encodeURIComponent(salesOrderId),
            { params: { organization_id: organizationId || undefined } }
        );

        return context.sendJson({}, 'out');
    }
};
