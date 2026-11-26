'use strict';
const ZohoClient = require('../../ZohoClient');

/**
 * Delete a customer payment: DELETE /customerpayments/{payment_id}.
 * @see https://www.zoho.com/books/api/v3/customer-payments/#delete-a-payment
 */
module.exports = {

    async receive(context) {

        const { organizationId, paymentId } = context.messages.in.content;

        if (!paymentId) {
            throw new context.CancelError('Payment ID is required!');
        }

        const zc = new ZohoClient(context);
        await zc.request(
            'DELETE',
            '/books/v3/customerpayments/' + encodeURIComponent(paymentId),
            { params: { organization_id: organizationId || undefined } }
        );

        return context.sendJson({}, 'out');
    }
};
