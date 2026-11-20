'use strict';
const XeroClient = require('../../XeroClient');

/**
 * Collect the human readable messages of a Xero error body
 * ({ Type, Message, Detail, Elements: [{ ValidationErrors: [{ Message }] }] }).
 */
function xeroErrorMessages(error) {

    const messages = [];
    (error?.Elements || []).forEach(element => {
        (element?.ValidationErrors || []).forEach(validationError => {
            if (validationError?.Message) {
                messages.push(validationError.Message);
            }
        });
    });
    if (!messages.length && error?.Detail) {
        messages.push(error.Detail);
    }
    if (!messages.length && error?.Message) {
        messages.push(error.Message);
    }
    return messages;
}

module.exports = {

    async receive(context) {

        const { tenantId, trackingCategoryId } = context.messages.in.content;

        if (!tenantId) {
            throw new context.CancelError('Tenant ID is required!');
        }
        if (!trackingCategoryId) {
            throw new context.CancelError('Tracking Category ID is required!');
        }

        const xc = new XeroClient(context, tenantId);
        try {
            await xc.request('DELETE', `/api.xro/2.0/TrackingCategories/${encodeURIComponent(trackingCategoryId)}`);
        } catch (e) {
            // Xero refuses to delete a tracking category that has been used on a transaction
            // (ValidationException, ErrorNumber 10). Such a category can only be archived.
            if (e?.Type === 'ValidationException' || e?.ErrorNumber === 10) {
                const detail = xeroErrorMessages(e).join(' ');
                throw new context.CancelError(
                    `Xero did not delete tracking category ${trackingCategoryId}${detail ? `: ${detail}` : '.'} ` +
                    'Xero deletes only a tracking category that has never been used on a transaction; ' +
                    'archive a used category in Xero instead.'
                );
            }
            throw e;
        }

        return context.sendJson({}, 'out');
    }
};
