'use strict';

const crypto = require('crypto');

module.exports = async context => {

    context.onListenerAdded(async listener => {

        // Components register with `realmId` (the QuickBooks company id) as a listener param.
        // Unlike Slack (which resolves userId from an accessToken), the realmId is passed
        // directly by the component, so no API call is needed here. We only validate and
        // normalize the params so the webhook handler can filter listeners by realmId.
        const realmId = listener.params?.realmId;
        if (!realmId) {
            throw new Error('Missing realmId listener param.');
        }

        listener.params = { realmId: `${realmId}` };
    });

    context.http.router.register({
        method: 'GET',
        path: '/',
        options: {
            handler: () => ({ version: require('./bundle.json').version }),
            auth: false
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/webhooks',
        options: {
            auth: false,
            handler: async (req, h) => {
                return module.exports.webhookHandler(context, req, h);
            }
        }
    });
};

module.exports.webhookHandler = async (context, req, h) => {

    context.log('info', 'quickbooks-plugin-route-webhook-hit', { payload: req.payload });

    if (!isPayloadValid(req.payload)) {
        context.log('error', 'quickbooks-plugin-route-webhook-missing-payload');
        return h.response().code(200);
    }
    // Validates the payload with the signature hash
    const signature = req.headers['intuit-signature'];
    const webhookKey = context.config?.webhookVerifierToken;
    if (!webhookKey) {
        context.log('error', 'quickbooks-plugin-route-webhook-missing-key');
        return h.response('No Verifier Token found').code(403);
    }
    const hash = crypto.createHmac('sha256', webhookKey).update(JSON.stringify(req.payload)).digest('base64');
    if (signature !== hash) {
        context.log('debug', 'quickbooks-plugin-route-webhook-invalid-signature', { config: context.config });
        context.log('error', 'quickbooks-plugin-route-webhook-invalid-signature', { signature, hash });
        return h.response('Forbidden: Invalid signature').code(403);
    }

    const realmIds = req.payload.eventNotifications?.map(notification => notification.realmId);
    /**
     * Combination of `name` and `operation` from entities in the payload.
     * @example ['Customer.Create', 'Invoice.Create', 'Customer.Update'];
     * @type {string[]} */
    const triggerTypes = [...new Set(req.payload.eventNotifications.flatMap(notification => {
        return notification.dataChangeEvent.entities.map(entity => `${entity.name}.${entity.operation}`);
    }))];
    const eventsCount = req.payload.eventNotifications.flatMap(n => n.dataChangeEvent.entities).length;
    context.log('debug', 'quickbooks-plugin-route-webhook-log', { realmIds, triggerTypes, eventsCount });

    // Loop over realms (tenants). AuthHub delivers all tenants through this single shared
    // endpoint, so we identify the owner of each event by the realmId in the payload and
    // route to registered listeners filtered by that realmId.
    for (const realmId of realmIds) {
        // Loop over trigger types (e.g. 'Invoice.Create')
        for (const triggerType of triggerTypes) {
            // Get all events/entities for the realm and triggerType
            const allEvents = req.payload.eventNotifications
                .find(n => n.realmId === realmId)?.dataChangeEvent.entities || [];
            const events = allEvents.filter(e => `${e.name}.${e.operation}` === triggerType);
            const entityIds = events.map(e => e.id);

            if (!entityIds.length) {
                continue;
            }

            context.log('debug', 'quickbooks-plugin-route-webhook-trigger-start', { realmId, triggerType, entityIds });
            try {
                const resp = await context.triggerListeners({
                    eventName: triggerType,
                    payload: entityIds,
                    filter: listener => listener.params.realmId === `${realmId}`
                });
                await context.log('info', 'quickbooks-plugin-route-webhook-trigger-ok', { realmId, triggerType, resp });
            } catch (error) {
                await context.log('error', 'quickbooks-plugin-route-webhook-trigger-error', { realmId, triggerType, error });
            }
        }
    }

    context.log('info', 'quickbooks-plugin-route-webhook-success', { realmIds, triggerTypes, eventsCount });

    // Empty response
    return h.response(undefined).code(200);
};

/** Payload must have eventNotifications with realmId (at least one) and dataChangeEvent with entities */
function isPayloadValid(payload) {
    return Array.isArray(payload?.eventNotifications)
        && payload.eventNotifications?.map(notification => notification.realmId).length
        && Array.isArray(payload?.eventNotifications[0]?.dataChangeEvent?.entities);
}
