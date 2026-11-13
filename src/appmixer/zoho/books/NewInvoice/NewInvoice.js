'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

// Tolerance for the clock difference between Zoho and the engine when the baseline tick finds
// no invoice to take the timestamp from.
const EMPTY_BASELINE_SKEW_MS = 60 * 1000;

// Zoho Books pages its listings. One page is enough for a normal tick, but if more invoices
// were created between two ticks than fit on a page, the oldest of them would fall off the
// end and `since` would then move past them — they would never be emitted. So keep reading
// pages until one reaches back before `since`, bounded so a misbehaving listing cannot spin.
const PAGE_SIZE = 200;
const MAX_PAGES = 25;

// Value of the Events property that also fires for changed invoices.
const EVENTS_CREATED_OR_UPDATED = 'created_or_updated';

// Upper bound of the invoice keys remembered between ticks in the created-or-updated mode.
const MAX_SEEN_KEYS = 2000;

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
 * One page of the invoice listing, newest first.
 * @param {ZohoClient} zc
 * @param {Object} params
 * @param {number} page 1-based
 * @returns {Promise<Array<Object>>}
 */
async function listPage(zc, params, page) {

    // eslint-disable-next-line camelcase
    const { invoices = [] } = await zc.request('GET', '/books/v3/invoices', {
        params: { ...params, page, per_page: PAGE_SIZE }
    });
    return invoices;
}

/**
 * Identifies one version of an invoice: the same invoice changed again is a new key.
 * @param {Object} invoice
 * @returns {string}
 */
function versionKey(invoice) {

    return `${invoice.invoice_id}@${invoice.last_modified_time || ''}`;
}

/**
 * All invoices modified after the given time. GET /invoices filters on `last_modified_time`; the
 * documented sort columns do not include it, so every page of the (normally short) answer is read.
 * @param {ZohoClient} zc
 * @param {Object} params
 * @param {number} since epoch ms
 * @returns {Promise<Array<Object>>}
 */
async function listModifiedSince(zc, params, since) {

    const modifiedParams = { ...params, last_modified_time: lib.formatTime(since) };
    const invoices = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        const next = await listPage(zc, modifiedParams, page);
        invoices.push(...next);
        if (next.length < PAGE_SIZE) break;
    }
    return invoices;
}

/**
 * Created-or-updated mode: fires for every invoice whose last modification is newer than the
 * previous tick - a new invoice, a status change (sent, paid, void, ...) or an edit.
 * @param {*} context
 * @param {ZohoClient} zc
 * @param {Object} params
 */
async function tickCreatedOrUpdated(context, zc, params) {

    const { modifiedInitialized, modifiedSince = 0, seen = [] } = context.state;

    if (!modifiedInitialized) {
        // Baseline: what changed just before the flow started must not fire.
        const start = Date.now() - EMPTY_BASELINE_SKEW_MS;
        const recent = await listModifiedSince(zc, params, start);
        return context.saveState({
            modifiedInitialized: true,
            modifiedSince: recent.reduce(
                (max, invoice) => Math.max(max, lib.parseTime(invoice.last_modified_time)),
                start
            ),
            seen: recent.map(versionKey).slice(0, MAX_SEEN_KEYS)
        });
    }

    const invoices = await listModifiedSince(zc, params, modifiedSince);
    if (!invoices.length) {
        // Nothing changed; keep the state as it is.
        return;
    }

    const seenKeys = new Set(seen);
    const changed = invoices
        .filter(invoice => !seenKeys.has(versionKey(invoice))
            && lib.parseTime(invoice.last_modified_time) >= modifiedSince)
        .sort((a, b) => lib.parseTime(a.last_modified_time) - lib.parseTime(b.last_modified_time));

    for (const summary of changed) {
        const invoice = await getInvoice(zc, params.organization_id, summary);
        await context.sendJson(invoice, 'out');
    }

    await context.saveState({
        modifiedInitialized: true,
        modifiedSince: invoices.reduce(
            (max, invoice) => Math.max(max, lib.parseTime(invoice.last_modified_time)),
            modifiedSince
        ),
        // The filter may include the boundary second; the keys keep those invoices from firing twice.
        seen: invoices.map(versionKey).slice(0, MAX_SEEN_KEYS)
    });
}

/**
 * Component which triggers whenever a new invoice is created in Zoho Books (or, with the Events
 * property set to created-or-updated, whenever an invoice is created or changed).
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

        if (context.properties.events === EVENTS_CREATED_OR_UPDATED) {
            return tickCreatedOrUpdated(context, zc, params);
        }

        const { initialized, known = [], since = 0 } = context.state;

        // The listing is newest first, so the first page always carries the newest invoice
        // and is all the baseline needs.
        const firstPage = await listPage(zc, params, 1);
        const newest = firstPage.reduce((max, invoice) => Math.max(max, createdAt(invoice)), 0);

        if (!initialized) {
            return context.saveState({
                initialized: true,
                known: firstPage.map(invoice => invoice.invoice_id),
                since: newest || Date.now() - EMPTY_BASELINE_SKEW_MS
            });
        }

        // Read further only while every invoice on the page is still newer than the last
        // tick — that is the case where invoices could otherwise fall off the end unseen.
        const invoices = firstPage.slice();
        let lastPageSize = firstPage.length;
        for (let page = 2; page <= MAX_PAGES; page++) {
            const oldest = invoices[invoices.length - 1];
            // A short page means the listing ended; an invoice older than the previous tick
            // means everything below it has been seen already.
            if (lastPageSize < PAGE_SIZE || !oldest || createdAt(oldest) < since) break;
            const next = await listPage(zc, params, page);
            lastPageSize = next.length;
            if (!next.length) break;
            invoices.push(...next);
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
            // Only the newest page is remembered: `since` keeps everything older from
            // re-firing, and an unbounded id list would grow with the account.
            known: firstPage.map(invoice => invoice.invoice_id),
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
