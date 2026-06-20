'use strict';
const ZohoClient = require('../../ZohoClient');

/**
 * Component which triggers whenever a new invoice is created in Zoho Books.
 * Polls the invoices endpoint sorted by creation time and caches the IDs of
 * the invoices already seen to detect the new ones.
 * @extends {Component}
 */
/**
 * Build the query parameters for the invoices listing based on component properties.
 * @param {Object} properties
 * @returns {Object}
 */
function buildParams(properties) {

    const { organizationId, status } = properties;

    if (!organizationId) {
        throw new Error('Organization ID is required!');
    }

    const params = {
        organization_id: organizationId,
        sort_column: 'created_time',
        sort_order: 'D'
    };
    if (status) {
        params.filter_by = status;
    }
    return params;
}

module.exports = {

    async tick(context) {

        let params;
        try {
            params = buildParams(context.properties);
        } catch (err) {
            throw new context.CancelError(err.message);
        }

        const zc = new ZohoClient(context);
        const { invoices = [] } = await zc.request('GET', '/books/v3/invoices', { params });

        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const diff = [];
        const actual = [];

        invoices.forEach(invoice => {
            if (known && !known.has(invoice.invoice_id)) {
                diff.push(invoice);
            }
            actual.push(invoice.invoice_id);
        });

        if (diff.length) {
            await Promise.all(diff.map(invoice => context.sendJson(invoice, 'out')));
        }

        await context.saveState({ known: actual });
    },

    // Flow Test Mode: emit one real, recent invoice so the trigger can be tested in the designer.
    async test(context) {

        let params;
        try {
            params = buildParams(context.properties);
        } catch (err) {
            throw new context.CancelError(err.message);
        }
        params.per_page = 1;

        const zc = new ZohoClient(context);
        const { invoices = [] } = await zc.request('GET', '/books/v3/invoices', { params });

        if (!invoices.length) {
            return;
        }

        return context.sendJson(invoices[0], 'out');
    }
};
