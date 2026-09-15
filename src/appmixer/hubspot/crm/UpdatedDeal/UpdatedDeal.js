'use strict';
const BaseSubscriptionComponent = require('../../BaseSubscriptionComponent');
const { getObjectProperties, parsePropertyList, eventChangedWatchedProperty } = require('../../commons');
const ITEM_SCHEMA = require('../../item-schemas.json').deal;

const subscriptionType = 'deal.propertyChange';

class UpdatedDeal extends BaseSubscriptionComponent {

    getListenerParams(context) {

        // routes.js subscribes to these on top of the default properties (custom properties included).
        const propertyNames = parsePropertyList(context.properties.watchedProperties);
        return propertyNames.length ? { propertyNames } : {};
    }

    async receive(context) {

        this.configureHubspot(context);

        const eventsByObjectId = context.messages.webhook.content.data;
        const watchedProperties = parsePropertyList(context.properties.watchedProperties);

        let events = {};
        // Locking to avoid duplicates. HubSpot payloads can come within milliseconds of each other.
        let lock;
        try {
            lock = await context.lock(context.componentId, {
                ttl: 1000 * 10,
                retryDelay: 500,
                maxRetryCount: 3
            });

            for (const [dealId, event] of Object.entries(eventsByObjectId)) {
                // Subscriptions are app-wide, so changes of properties watched by other flows arrive here too.
                if (!eventChangedWatchedProperty(event, watchedProperties)) {
                    continue;
                }
                // Scope the dedupe key per component instance — staticCache is shared across all
                // instances, so two flows must not consume each other's events.
                const cacheKey = `hubspot-deal-updated-${context.componentId}-${dealId}`;
                const cached = await context.staticCache.get(cacheKey);
                if (cached && event.occurredAt <= cached) {
                    continue;
                }
                // Cache the event for 5s to avoid duplicates
                await context.staticCache.set(cacheKey, event.occurredAt, context.config?.eventCacheTTL || 5000);
                events[dealId] = { occurredAt: event.occurredAt };
            }
        } finally {
            await lock?.unlock();
        }

        // Get all objectIds
        const ids = Object.keys(events);
        if (!ids.length) {
            return context.response();
        }

        let propertiesToReturn;
        const { properties } = context.properties;
        if (!properties) {
            // Return all properties by default.
            propertiesToReturn = await getObjectProperties(context, this.hubspot, 'deals', 'names');
        } else {
            propertiesToReturn = properties.split(',');
        }

        // Call the API to get the contacts in bulk
        const { data } = await this.hubspot.call('post', 'crm/v3/objects/deals/batch/read', {
            inputs: ids.map((id) => ({ id })),
            properties: propertiesToReturn
        });

        const { pipeline: filterPipeline, dealstage: filterStage } = context.properties;

        const results = [];
        data.results.forEach((deal) => {
            if (deal.updatedAt !== deal.createdAt) {
                // Filter by pipeline if configured
                if (filterPipeline && deal.properties?.pipeline !== filterPipeline) {
                    return;
                }
                // Filter by deal stage if configured
                if (filterStage && deal.properties?.dealstage !== filterStage) {
                    return;
                }
                results.push(deal);
            }
        });

        await context.sendArray(results, 'deal');

        return context.response();
    }

    async test(context) {

        const { pipeline: filterPipeline, dealstage: filterStage } = context.properties;
        const filters = [];
        if (filterPipeline) {
            filters.push({ propertyName: 'pipeline', operator: 'EQ', value: filterPipeline });
        }
        if (filterStage) {
            filters.push({ propertyName: 'dealstage', operator: 'EQ', value: filterStage });
        }
        const record = await this.fetchLatestExample(context, 'deals', { sortProperty: 'lastmodifieddate', filters });
        if (!record) {
            throw new context.CancelError('No deal found to use as test data.');
        }
        return context.sendJson(record, 'deal');
    }
}

module.exports = new UpdatedDeal(subscriptionType);
module.exports.ITEM_SCHEMA = ITEM_SCHEMA;
