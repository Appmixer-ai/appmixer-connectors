'use strict';
const ZohoClient = require('../../ZohoClient');

// Tolerance for the clock difference between Zoho and the engine when the baseline tick finds
// no invoice to take the timestamp from.
const EMPTY_BASELINE_SKEW_MS = 60 * 1000;

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

/**
 * Zoho Books returns created_time as '2026-06-20T10:30:00+0000' - the offset has no colon.
 * @param {Object} invoice
 * @returns {number} epoch ms, 0 when the value is missing or unparsable
 */
function createdAt(invoice) {

    const value = String(invoice?.created_time || '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
    const time = Date.parse(value);
    return Number.isNaN(time) ? 0 : time;
}

/**
 * The listing returns a summary only (no line items, no addresses), the out port promises the
 * whole invoice.
 * @param {ZohoClient} zc
 * @param {string} organizationId
 * @param {Object} summary
 * @returns {Promise<Object>}
 */
async function getInvoice(zc, organizationId, summary) {

    const { invoice } = await zc.request('GET', `/books/v3/invoices/${summary.invoice_id}`, {
        params: { organization_id: organizationId }
    });
    return invoice || summary;
}

/**
 * Component which triggers whenever a new invoice is created in Zoho Books.
 * Polls the invoices endpoint sorted by creation time. An invoice is new when it has not been
 * seen yet and was created after the newest invoice of the baseline tick - the second condition
 * keeps an old invoice from firing when a status change moves it into the watched status.
 * @extends {Component}
 */
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

        const { initialized, known = [], since = 0 } = context.state;
        const newest = invoices.reduce((max, invoice) => Math.max(max, createdAt(invoice)), 0);

        if (!initialized) {
            return context.saveState({
                initialized: true,
                known: invoices.map(invoice => invoice.invoice_id),
                since: newest || Date.now() - EMPTY_BASELINE_SKEW_MS
            });
        }

        const seen = new Set(known);
        const diff = invoices
            .filter(invoice => !seen.has(invoice.invoice_id) && createdAt(invoice) >= since)
            .reverse();

        for (const summary of diff) {
            const invoice = await getInvoice(zc, params.organization_id, summary);
            await context.sendJson(invoice, 'out');
        }

        await context.saveState({
            initialized: true,
            known: invoices.map(invoice => invoice.invoice_id),
            since: Math.max(since, newest)
        });
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
            throw new Error('No invoices found for the selected organization/status to use as test data.');
        }

        return context.sendJson(await getInvoice(zc, params.organization_id, invoices[0]), 'out');
    }
};
