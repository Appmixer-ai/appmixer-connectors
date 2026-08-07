'use strict';

const crypto = require('crypto');

const SERVICE_ID = 'appmixer.quickbooks';

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
            // bundle.json is not part of the deployed plugin package, so this must not throw
            // — the route exists as a liveness probe, the version is a nice-to-have.
            handler: () => {
                try {
                    return { version: require('./bundle.json').version };
                } catch (error) {
                    return { version: null };
                }
            },
            auth: false
        }
    });

    // Fallback listener registration used by the trigger components (via context.callAppmixer).
    //
    // WORKAROUND for an engine defect observed on 6.6.0: context.addListener() in a component
    // acknowledges the call but does not persist the listener into the engine's `listeners`
    // collection (and consequently never invokes onListenerAdded), so context.triggerListeners()
    // finds no listeners to deliver to. The read path is healthy: a listener document in the
    // collection is picked up and delivered correctly. These routes replace only the broken
    // write path, using the exact document shape the engine reads. Remove them (and the
    // callAppmixer calls in the triggers) once the engine persists listeners itself — the
    // upsert-by-{url, eventName} below keeps the registration single even when both paths work.
    context.http.router.register({
        method: 'POST',
        path: '/listeners',
        options: {
            handler: async (req, h) => {

                const { eventName, realmId, flowId, componentId, apiOrigin } = req.payload || {};
                if (!eventName || !realmId || !flowId || !componentId) {
                    return h.response('eventName, realmId, flowId and componentId are required.').code(400);
                }
                // apiOrigin comes from the component (context.getWebhookUrl) — through
                // callAppmixer this request carries an internal hostname, which would
                // produce an undeliverable listener URL.
                const origin = apiOrigin || `https://${req.info.hostname}`;
                const hostname = new URL(origin).hostname;
                const url = `${origin}/flows/${flowId}/components/${componentId}`;
                const collection = context.db.coreCollection('listeners');
                // Upsert: one registration per (component, eventName), no matter how many
                // times the flow restarts or whether the engine's own write also succeeded.
                await collection.deleteMany({ url, eventName });
                await collection.insertMany([{
                    eventName,
                    hostname,
                    mtime: new Date(),
                    params: { realmId: `${realmId}` },
                    serviceId: SERVICE_ID,
                    url
                }]);
                await context.log('info', 'quickbooks-plugin-listener-registered', { eventName, realmId: `${realmId}`, url });
                return {};
            }
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/listeners/remove',
        options: {
            handler: async (req, h) => {

                const { eventName, flowId, componentId } = req.payload || {};
                if (!eventName || !flowId || !componentId) {
                    return h.response('eventName, flowId and componentId are required.').code(400);
                }
                // Match by the flow/component path suffix so the registration is found no
                // matter which origin it was stored under.
                const urlPattern = new RegExp(`/flows/${flowId}/components/${componentId}$`);
                await context.db.coreCollection('listeners').deleteMany({ url: urlPattern, eventName });
                await context.log('info', 'quickbooks-plugin-listener-removed', { eventName, flowId, componentId });
                return {};
            }
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

    // Group entities by realm (tenant). A single payload may carry more than one notification
    // for the same realmId, so entities are merged instead of looked up by the first match.
    /** @type {Map<string, Array<object>>} */
    const entitiesByRealm = new Map();
    for (const notification of req.payload.eventNotifications) {
        const realmId = `${notification.realmId}`;
        const entities = notification.dataChangeEvent?.entities || [];
        entitiesByRealm.set(realmId, (entitiesByRealm.get(realmId) || []).concat(entities));
    }

    const realmIds = [...entitiesByRealm.keys()];
    const eventsCount = [...entitiesByRealm.values()].reduce((sum, entities) => sum + entities.length, 0);
    context.log('debug', 'quickbooks-plugin-route-webhook-log', { realmIds, eventsCount });

    // AuthHub delivers all tenants through this single shared endpoint, so we identify the
    // owner of each event by the realmId in the payload and route to registered listeners
    // filtered by that realmId.
    for (const [realmId, entities] of entitiesByRealm) {
        /**
         * Combination of `name` and `operation` from the realm's entities.
         * @example ['Customer.Create', 'Invoice.Create', 'Customer.Update'];
         * @type {string[]} */
        const triggerTypes = [...new Set(entities.map(entity => `${entity.name}.${entity.operation}`))];
        // Loop over trigger types (e.g. 'Invoice.Create')
        for (const triggerType of triggerTypes) {
            const entityIds = entities
                .filter(entity => `${entity.name}.${entity.operation}` === triggerType)
                .map(entity => entity.id);

            context.log('debug', 'quickbooks-plugin-route-webhook-trigger-start', { realmId, triggerType, entityIds });
            try {
                const resp = await context.triggerListeners({
                    eventName: triggerType,
                    payload: entityIds,
                    filter: listener => listener.params.realmId === realmId
                });
                await context.log('info', 'quickbooks-plugin-route-webhook-trigger-ok', { realmId, triggerType, resp });
            } catch (error) {
                await context.log('error', 'quickbooks-plugin-route-webhook-trigger-error', { realmId, triggerType, error });
            }
        }
    }

    context.log('info', 'quickbooks-plugin-route-webhook-success', { realmIds, eventsCount });

    // Empty response
    return h.response(undefined).code(200);
};

/** Payload must have eventNotifications with realmId (at least one) and dataChangeEvent with entities */
function isPayloadValid(payload) {
    return Array.isArray(payload?.eventNotifications)
        && payload.eventNotifications?.map(notification => notification.realmId).length
        && Array.isArray(payload?.eventNotifications[0]?.dataChangeEvent?.entities);
}
