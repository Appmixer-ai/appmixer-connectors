'use strict';
const ZohoClient = require('../../ZohoClient');

/**
 * Delete an item: DELETE /items/{item_id}.
 * @see https://www.zoho.com/books/api/v3/items/#delete-an-item
 */
module.exports = {

    async receive(context) {

        const { organizationId, itemId } = context.messages.in.content;

        if (!itemId) {
            throw new context.CancelError('Item ID is required!');
        }

        const zc = new ZohoClient(context);
        await zc.request(
            'DELETE',
            '/books/v3/items/' + encodeURIComponent(itemId),
            { params: { organization_id: organizationId || undefined } }
        );

        return context.sendJson({}, 'out');
    }
};
