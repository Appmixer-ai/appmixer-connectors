'use strict';

const Hubspot = require('../Hubspot');
const { getObjectProperties } = require('../commons');

// Default polling window overlap: records indexed by the CRM search API later than this after their
// creation are not picked up. The search index usually lags a few seconds.
const DEFAULT_OVERLAP_MS = 10 * 60 * 1000;
// The CRM search API returns at most 200 records per page.
const SEARCH_PAGE_SIZE = 200;
// Upper bound of records read per poll (the search API itself stops at 10,000).
const DEFAULT_MAX_RECORDS_PER_POLL = 1000;
// HubSpot's batch/read endpoint accepts at most 100 inputs per call.
const BATCH_READ_CHUNK_SIZE = 100;

/**
 * Shared implementation of the polling "New <object>" triggers (NewTicket, NewCompany).
 *
 * The CRM search API is asked for the records created inside a window that starts at the last
 * successful poll (minus an overlap for the search index lag), newest first. Records not seen
 * before are read through batch/read — the same shape NewContact / NewDeal emit — and sent
 * oldest first. The state keeps the IDs seen inside the window (with their creation time) so an
 * empty or failed answer never makes old records fire again, and a record created before the
 * trigger started never fires.
 */
class NewObjectsPoller {

    /**
     * @param {object} options
     * @param {string} options.objectType CRM object type in the API path ('tickets', 'companies').
     * @param {string} options.outPort Output port name.
     * @param {function(object): object[]} [options.filters] Extra search filters from context.properties.
     */
    constructor({ objectType, outPort, filters = () => [] }) {

        this.objectType = objectType;
        this.outPort = outPort;
        this.filters = filters;
    }

    client(context) {

        return new Hubspot(context.auth.accessToken, context.config, context.httpRequest);
    }

    async resolveProperties(context, hubspot) {

        const { properties } = context.properties;
        if (!properties) {
            return getObjectProperties(context, hubspot, this.objectType, 'names');
        }
        return properties.split(',').map(property => property.trim()).filter(Boolean);
    }

    /** Records created at or after `since` (ms), newest first, at most `maxRecords`. */
    async searchCreatedSince(context, hubspot, since, maxRecords) {

        const filters = [
            { propertyName: 'createdate', operator: 'GTE', value: String(since) },
            ...this.filters(context.properties || {})
        ];
        const records = [];
        let after;
        do {
            const body = {
                filterGroups: [{ filters }],
                sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
                properties: ['createdate'],
                limit: Math.min(SEARCH_PAGE_SIZE, maxRecords - records.length)
            };
            if (after) {
                body.after = after;
            }
            const { data } = await hubspot.call('post', `crm/v3/objects/${this.objectType}/search`, body);
            records.push(...(data.results || []));
            after = data.paging?.next?.after;
        } while (after && records.length < maxRecords);

        return records;
    }

    async readBatch(hubspot, ids, properties) {

        const records = [];
        for (let i = 0; i < ids.length; i += BATCH_READ_CHUNK_SIZE) {
            const chunk = ids.slice(i, i + BATCH_READ_CHUNK_SIZE);
            const { data } = await hubspot.call('post', `crm/v3/objects/${this.objectType}/batch/read`, {
                inputs: chunk.map((id) => ({ id })),
                properties
            });
            records.push(...(data.results || []));
        }
        // batch/read does not keep the input order.
        const position = new Map(ids.map((id, index) => [String(id), index]));
        return records.sort((a, b) => position.get(String(a.id)) - position.get(String(b.id)));
    }

    async start(context) {

        // Records created before the trigger started are never emitted.
        const now = Date.now();
        return context.saveState({ startedAt: now, lastPollAt: now, known: {} });
    }

    async tick(context) {

        const state = context.state || {};
        const now = Date.now();
        if (!state.startedAt) {
            // A trigger started by an older version without state: start watching from now.
            return context.saveState({ startedAt: now, lastPollAt: now, known: {} });
        }

        const overlap = context.config?.pollOverlapMs || DEFAULT_OVERLAP_MS;
        const maxRecords = context.config?.pollMaxRecords || DEFAULT_MAX_RECORDS_PER_POLL;
        const since = Math.max(state.startedAt, (state.lastPollAt || state.startedAt) - overlap);
        const known = state.known || {};

        const hubspot = this.client(context);
        const found = await this.searchCreatedSince(context, hubspot, since, maxRecords);

        const newIds = [];
        const nextKnown = {};
        // Keep what is still inside the next window — an empty answer must not forget it.
        const nextSince = Math.max(state.startedAt, now - overlap);
        for (const [id, createdAt] of Object.entries(known)) {
            if (createdAt >= nextSince) {
                nextKnown[id] = createdAt;
            }
        }
        for (const record of found) {
            const createdAt = Date.parse(record.properties?.createdate || record.createdAt);
            if (!known[record.id] && !(createdAt < state.startedAt)) {
                newIds.push(String(record.id));
            }
            nextKnown[record.id] = Number.isNaN(createdAt) ? now : createdAt;
        }

        if (newIds.length) {
            // Oldest first, so the flow processes the records in the order they were created.
            newIds.reverse();
            const properties = await this.resolveProperties(context, hubspot);
            const records = await this.readBatch(hubspot, newIds, properties);
            for (const record of records) {
                await context.sendJson(record, this.outPort);
            }
        }

        // Saved only after a successful emit: a failed poll is repeated with the same window.
        return context.saveState({ startedAt: state.startedAt, lastPollAt: now, known: nextKnown });
    }

    /**
     * Flow Test Mode: the newest record matching the trigger's filters, read like tick() reads it.
     * Read-only, no state writes. Throws when there is no record to show.
     */
    async fetchExample(context) {

        const hubspot = this.client(context);
        const { data } = await hubspot.call('post', `crm/v3/objects/${this.objectType}/search`, {
            filterGroups: [{ filters: [
                { propertyName: 'createdate', operator: 'HAS_PROPERTY' },
                ...this.filters(context.properties || {})
            ] }],
            sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
            properties: ['createdate'],
            limit: 1
        });
        const latest = data.results && data.results[0];
        if (!latest) {
            throw new context.CancelError(`No ${this.objectType} found to use as test data. Create one in HubSpot first.`);
        }
        const properties = await this.resolveProperties(context, hubspot);
        const [record] = await this.readBatch(hubspot, [String(latest.id)], properties);
        if (!record) {
            throw new context.CancelError(`Could not read the latest ${this.objectType} to use as test data.`);
        }
        return record;
    }
}

module.exports = NewObjectsPoller;
