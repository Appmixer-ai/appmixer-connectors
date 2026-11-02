'use strict';

const crypto = require('crypto');

module.exports = async context => {

    context.onListenerAdded(async listener => {

        // Components register with `realmId` (the QuickBooks company id) and their current
        // `accessToken`. Events are routed to listeners by realmId, so the realm must belong to
        // the caller: the token has to be able to read that company, otherwise anyone could
        // register another company's realmId and receive its events. The token is used only for
        // this check — it is never logged and never stored with the listener.
        const realmId = listener.params?.realmId;
        const accessToken = listener.params?.accessToken;
        if (listener.params) {
            delete listener.params.accessToken;
        }
        if (!realmId) {
            throw new Error('Missing realmId listener param.');
        }

        if (accessToken) {
            await module.exports.verifyRealmAccess(context, `${realmId}`, accessToken);
        } else if (isTokenRequired(context)) {
            throw listenerError('Missing accessToken listener param.', 400);
        } else {
            // Transition period: triggers of older connector versions register without a token.
            // Accept them (so their webhooks keep working) but log it; set
            // `requireListenerAccessToken` in the Backoffice to reject them.
            context.log('warn', 'quickbooks-plugin-listener-without-token', {
                eventName: listener.eventName,
                realmId: `${realmId}`
            });
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
    // Validates the payload with the signature hash. Intuit issues a separate verifier token
    // for the Development (sandbox) and Production webhook sections of the app, and both can be
    // pointed at this single endpoint — realm-based listener filtering keeps the routing correct.
    // Accepts several tokens: `webhookVerifierToken` (comma-separated) plus an optional
    // `webhookVerifierTokenSandbox`.
    const signature = req.headers['intuit-signature'];
    const webhookKeys = [context.config?.webhookVerifierToken, context.config?.webhookVerifierTokenSandbox]
        .filter(Boolean)
        .flatMap(value => `${value}`.split(',').map(token => token.trim()).filter(Boolean));
    if (!webhookKeys.length) {
        context.log('error', 'quickbooks-plugin-route-webhook-missing-key');
        return h.response('No Verifier Token found').code(403);
    }
    const body = JSON.stringify(req.payload);
    const signatureValid = webhookKeys.some(
        key => crypto.createHmac('sha256', key).update(body).digest('base64') === signature
    );
    if (!signatureValid) {
        context.log('error', 'quickbooks-plugin-route-webhook-invalid-signature', { signature });
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

function isTokenRequired(context) {

    const value = context.config?.requireListenerAccessToken;
    return value === true || value === 'true';
}

function listenerError(message, statusCode) {

    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

/**
 * API base URLs the realm is checked against. The configured environment goes first; the other
 * one follows because a single endpoint can serve both the Development (sandbox) and Production
 * sections of the Intuit app (see the verifier tokens in the webhook handler).
 * @return {string[]}
 */
function getApiUrls(context) {

    const config = context.config || {};
    const isSandbox = config.sandbox === true || config.sandbox === 'true';
    const sandbox = config.sandboxApiURL || 'https://sandbox-quickbooks.api.intuit.com';
    const production = config.prodApiURL || config.prodApiUrl || 'https://quickbooks.api.intuit.com';
    return [...new Set(isSandbox ? [sandbox, production] : [production, sandbox])];
}

/**
 * Throws (403) unless `accessToken` can read the company `realmId`
 * (GET /v3/company/{realmId}/companyinfo/{realmId}).
 */
module.exports.verifyRealmAccess = async (context, realmId, accessToken) => {

    if (!/^[0-9A-Za-z]+$/.test(realmId)) {
        throw listenerError('Invalid realmId listener param.', 400);
    }

    const statuses = [];
    for (const apiUrl of getApiUrls(context)) {
        try {
            const response = await context.httpRequest({
                method: 'GET',
                url: `${apiUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json'
                }
            });
            // The URL is scoped to the realm and Intuit rejects a token of another company (403),
            // so a CompanyInfo in the response proves access. CompanyInfo.Id is not the realmId.
            if (response?.data?.CompanyInfo) {
                return;
            }
            statuses.push('no-company-info');
        } catch (error) {
            // Log only the status: the error object carries the request headers (the token).
            statuses.push(error?.response?.status || error?.code || 'error');
        }
    }

    context.log('error', 'quickbooks-plugin-listener-realm-denied', { realmId, statuses });
    throw listenerError(`The connected QuickBooks account cannot access company ${realmId}.`, 403);
};
