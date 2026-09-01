'use strict';
const ZohoNotifiable = require('../../ZohoNotifiable');
const lib = require('../../lib');

const DEFAULT_CLOSED_STATUS = 'Closed';
// Zoho only reports that a case was edited, not what changed, so an already reported case is
// remembered for a week to avoid re-firing on every later edit of the same closed case.
const DEDUPLICATION_TTL = 7 * 24 * 60 * 60 * 1000;

class CaseClosed extends ZohoNotifiable {

    async receive(context) {

        const closedStatus = context.properties.closedStatus || DEFAULT_CLOSED_STATUS;
        const { ids } = context.messages.webhook.content.data;
        const records = await this.makeZohoClient(context).getRecords('Cases', {
            params: { ids: ids.join(',') }
        });

        for (const record of records) {
            if (record.Status !== closedStatus) {
                continue;
            }
            const cacheKey = `case-closed-${context.componentId}-${record.id}`;
            if (await context.staticCache.get(cacheKey)) {
                continue;
            }
            await context.staticCache.set(cacheKey, true, DEDUPLICATION_TTL);
            await context.sendJson(record, 'out');
        }
    }

    async test(context) {

        const closedStatus = context.properties.closedStatus || DEFAULT_CLOSED_STATUS;
        const criteria = `(Status:equals:${lib.escapeCriteriaValue(closedStatus)})`;
        const records = await this.makeZohoClient(context).search('Cases', { criteria });

        if (!records.length) {
            throw new context.CancelError(`No cases with the status "${closedStatus}" found to use as test data.`);
        }

        return context.sendJson(records[0], 'out');
    }
}

const events = [
    'Cases.edit'
];

/**
 * Component which triggers whenever a case moves into the configured closed status.
 */
module.exports = new CaseClosed(events);
