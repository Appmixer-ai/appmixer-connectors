'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

// Tolerance for the clock difference between Zoho and the engine when the baseline tick finds
// no contact to take the timestamp from.
const EMPTY_BASELINE_SKEW_MS = 60 * 1000;

// More contacts can be created between two ticks than fit on one page; keep reading pages until
// one reaches back before `since`, bounded so a misbehaving listing cannot spin.
const MAX_PAGES = 25;

/**
 * Query parameters of the contacts listing, newest first.
 * @param {Object} properties
 * @returns {Object}
 */
function buildParams(properties) {

    const { organizationId, contactType } = properties;

    if (!organizationId) {
        throw new Error('Organization ID is required!');
    }

    const params = {
        organization_id: organizationId,
        sort_column: 'created_time',
        sort_order: 'D'
    };
    if (contactType) {
        params.contact_type = contactType;
    }
    return params;
}

/**
 * @param {Object} contact
 * @returns {number} epoch ms
 */
function createdAt(contact) {

    return lib.parseTime(contact?.created_time);
}

/**
 * One page of the contacts listing, newest first.
 * @param {ZohoClient} zc
 * @param {Object} params
 * @param {number} page 1-based
 * @returns {Promise<Array<Object>>}
 */
async function listPage(zc, params, page) {

    const { contacts = [] } = await zc.request('GET', '/books/v3/contacts', {
        params: { ...params, page, per_page: lib.PAGE_SIZE }
    });
    return contacts;
}

/**
 * Triggers when a new contact is created in Zoho Books. Polls GET /contacts sorted by creation
 * time. A contact is new when it has not been seen yet and was created after the newest contact
 * of the baseline tick - the second condition keeps an old contact from firing when it moves
 * onto the first page (e.g. a deleted newer contact) or into the watched contact type.
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
        const { initialized, known = [], since = 0 } = context.state;

        const firstPage = await listPage(zc, params, 1);
        const newest = firstPage.reduce((max, contact) => Math.max(max, createdAt(contact)), 0);

        if (!initialized) {
            return context.saveState({
                initialized: true,
                known: firstPage.map(contact => contact.contact_id),
                since: newest || Date.now() - EMPTY_BASELINE_SKEW_MS
            });
        }

        // A degraded, empty answer must not become the state: the next tick would re-fire the page.
        if (!firstPage.length && known.length) {
            return;
        }

        // Read further only while every contact on the page is still newer than the last tick.
        const contacts = firstPage.slice();
        let lastPageSize = firstPage.length;
        for (let page = 2; page <= MAX_PAGES; page++) {
            const oldest = contacts[contacts.length - 1];
            if (lastPageSize < lib.PAGE_SIZE || !oldest || createdAt(oldest) < since) break;
            const next = await listPage(zc, params, page);
            lastPageSize = next.length;
            if (!next.length) break;
            contacts.push(...next);
        }

        const seen = new Set(known);
        const diff = contacts
            .filter(contact => !seen.has(contact.contact_id) && createdAt(contact) >= since)
            .reverse();

        for (const contact of diff) {
            await context.sendJson(contact, 'out');
        }

        await context.saveState({
            initialized: true,
            // Only the newest page is remembered: `since` keeps everything older from re-firing.
            known: firstPage.map(contact => contact.contact_id),
            since: Math.max(since, newest)
        });
    },

    // Flow Test Mode: emit the most recently created contact so the trigger can be tested in the designer.
    async test(context) {

        let params;
        try {
            params = buildParams(context.properties);
        } catch (err) {
            throw new context.CancelError(err.message);
        }

        const zc = new ZohoClient(context);
        const { contacts = [] } = await zc.request('GET', '/books/v3/contacts', {
            params: { ...params, page: 1, per_page: 1 }
        });

        if (!contacts.length) {
            throw new Error('No contacts found for the selected organization/contact type to use as test data.');
        }

        return context.sendJson(contacts[0], 'out');
    }
};
