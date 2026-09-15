'use strict';
const BaseSubscriptionComponent = require('../../BaseSubscriptionComponent');
const { getObjectProperties, parsePropertyList, eventChangedWatchedProperty } = require('../../commons');
const ITEM_SCHEMA = require('../../item-schemas.json').contact;

const subscriptionType = 'contact.propertyChange';

class UpdatedContact extends BaseSubscriptionComponent {

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

            for (const [contactId, event] of Object.entries(eventsByObjectId)) {
                // Subscriptions are app-wide, so changes of properties watched by other flows arrive here too.
                if (!eventChangedWatchedProperty(event, watchedProperties)) {
                    continue;
                }
                // Scope the dedupe key per component instance — staticCache is shared across all
                // instances, so two flows must not consume each other's events.
                const cacheKey = `hubspot-contact-updated-${context.componentId}-${contactId}`;
                const cached = await context.staticCache.get(cacheKey);
                if (cached && event.occurredAt <= cached) {
                    continue;
                }
                // Cache the event for 5s to avoid duplicates
                await context.staticCache.set(cacheKey, event.occurredAt, context.config?.eventCacheTTL || 5000);
                events[contactId] = { occurredAt: event.occurredAt };
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
            propertiesToReturn = await getObjectProperties(context, this.hubspot, 'contacts', 'names');
        } else {
            propertiesToReturn = properties.split(',');
        }

        // Call the API to get the contacts in bulk
        const { data } = await this.hubspot.call('post', 'crm/v3/objects/contacts/batch/read', {
            inputs: ids.map((id) => ({ id })),
            properties: propertiesToReturn
        });

        const results = [];
        data.results.forEach((contact) => {
            if (contact.updatedAt !== contact.createdAt) {
                results.push(contact);
            }
        });

        await context.sendArray(results, 'contact');

        return context.response();
    }

    async test(context) {

        const record = await this.fetchLatestExample(context, 'contacts', { sortProperty: 'lastmodifieddate' });
        if (!record) {
            throw new context.CancelError('No contact found to use as test data.');
        }
        return context.sendJson(record, 'contact');
    }
}

module.exports = new UpdatedContact(subscriptionType);
module.exports.ITEM_SCHEMA = ITEM_SCHEMA;
