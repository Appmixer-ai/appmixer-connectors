'use strict';
const ZohoClient = require('../../ZohoClient');

/**
 * Delete an estimate: DELETE /estimates/{estimate_id}.
 * @see https://www.zoho.com/books/api/v3/estimates/#delete-an-estimate
 */
module.exports = {

    async receive(context) {

        const { organizationId, estimateId } = context.messages.in.content;

        if (!estimateId) {
            throw new context.CancelError('Estimate ID is required!');
        }

        const zc = new ZohoClient(context);
        await zc.request(
            'DELETE',
            '/books/v3/estimates/' + encodeURIComponent(estimateId),
            { params: { organization_id: organizationId || undefined } }
        );

        return context.sendJson({}, 'out');
    }
};
