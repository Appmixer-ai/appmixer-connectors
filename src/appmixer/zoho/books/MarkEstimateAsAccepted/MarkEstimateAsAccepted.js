'use strict';
const ZohoClient = require('../../ZohoClient');

/**
 * Mark an estimate as accepted: POST /estimates/{estimate_id}/status/accepted.
 * @see https://www.zoho.com/books/api/v3/estimates/#mark-an-estimate-as-accepted
 */
module.exports = {

    async receive(context) {

        const { organizationId, estimateId } = context.messages.in.content;

        if (!estimateId) {
            throw new context.CancelError('Estimate ID is required!');
        }

        const zc = new ZohoClient(context);
        await zc.request(
            'POST',
            '/books/v3/estimates/' + encodeURIComponent(estimateId) + '/status/accepted',
            { params: { organization_id: organizationId || undefined } }
        );

        return context.sendJson({}, 'out');
    }
};
