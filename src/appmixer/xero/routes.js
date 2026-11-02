'use strict';

const crypto = require('crypto');

const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';

module.exports = async context => {

    // Every Xero trigger registers for `<CATEGORY>.<TYPE>:<tenantId>`. The tenantId comes from a
    // component property that any flow user can edit, so the registration must prove that the
    // user's Xero connection is authorised for that organisation. See verifyListener().
    context.onListenerAdded(async listener => module.exports.verifyListener(context, listener));

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
            payload: {
                parse: false
            },
            handler: async (req, h) => {
                return module.exports.webhookHandler(context, req, h);
            }
        }
    });
};

/**
 * Error thrown when a listener registration is rejected. statusCode/isClientError mark it as a
 * client (4xx) error for the caller of POST /listeners.
 */
class ListenerRejectedError extends Error {
    constructor(message, statusCode = 403) {
        super(message);
        this.name = 'ListenerRejectedError';
        this.statusCode = statusCode;
        this.isClientError = true;
    }
}

module.exports.ListenerRejectedError = ListenerRejectedError;

/**
 * Whether listeners registered without an access token are rejected. During the transition period
 * (default) they are accepted and logged, so tenants running an older Xero connector version (which
 * does not send the token) keep their webhooks; set the `requireListenerToken` config to true to
 * reject them.
 */
module.exports.isTokenRequired = context => {

    const value = context.config?.requireListenerToken;
    return value === true || `${value}`.toLowerCase() === 'true';
};

/**
 * Returns the tenantId (Xero organisation) of a listener event name `<CATEGORY>.<TYPE>:<tenantId>`.
 * @param {string} eventName
 * @returns {string|null}
 */
module.exports.getTenantIdFromEventName = eventName => {

    if (typeof eventName !== 'string') {
        return null;
    }
    const separator = eventName.indexOf(':');
    if (separator <= 0) {
        return null;
    }
    const tenantId = eventName.slice(separator + 1).trim();
    return tenantId || null;
};

/**
 * Hub-side check of a listener registration (context.onListenerAdded). The trigger sends its
 * current access token in `params.accessToken`; the tenantId in the event name must be one of the
 * organisations that token is connected to (GET https://api.xero.com/connections). The token is
 * removed from the params before the listener is stored and is never logged.
 * @param {object} context Plugin context.
 * @param {{ eventName: string, params?: object }} listener The listener before it is stored.
 * @returns {Promise<void>}
 */
module.exports.verifyListener = async (context, listener) => {

    const params = listener.params || {};
    const { accessToken } = params;
    // Never store the token with the listener, whatever the outcome of the check.
    delete params.accessToken;
    listener.params = params;

    const eventName = listener.eventName;
    const tenantId = module.exports.getTenantIdFromEventName(eventName);
    if (!tenantId) {
        throw new ListenerRejectedError('Invalid Xero listener event name.', 400);
    }

    if (!accessToken) {
        if (module.exports.isTokenRequired(context)) {
            context.log('error', 'xero-plugin-listener-rejected-missing-token', { eventName });
            throw new ListenerRejectedError(
                'Missing access token. Upgrade the Xero connector to register Xero triggers.',
                401
            );
        }
        // Transition period: an older connector version registered the listener without a token.
        context.log('warn', 'xero-plugin-listener-accepted-without-token', { eventName });
        return;
    }

    let connections;
    try {
        const response = await context.httpRequest({
            method: 'GET',
            url: XERO_CONNECTIONS_URL,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            }
        });
        connections = response?.data;
    } catch (err) {
        // Log the status only: the error object carries the request headers (the token).
        const status = err?.response?.status;
        context.log('error', 'xero-plugin-listener-connections-failed', { eventName, status });
        if (status === 401 || status === 403) {
            throw new ListenerRejectedError('The Xero access token is not valid.', 401);
        }
        throw new Error(`Unable to verify the Xero organisation of the listener (status ${status || 'unknown'}).`);
    }

    const tenantIds = (Array.isArray(connections) ? connections : [])
        .map(connection => connection?.tenantId)
        .filter(Boolean);
    if (!tenantIds.includes(tenantId)) {
        context.log('error', 'xero-plugin-listener-rejected-foreign-tenant', { eventName });
        throw new ListenerRejectedError('The Xero connection is not authorised for this organisation (Tenant ID).');
    }

    context.log('info', 'xero-plugin-listener-verified', { eventName });
};

module.exports.webhookHandler = async (context, req, h) => {

    context.log('info', 'xero-plugin-route-webhook-hit');

    /** Raw payload from the webhook. We can't use the parsed payload as it's already parsed by the framework.
     *  We can't use JSON.stringify(req.payload) as it will remove any whitespace and the signature will not match
	 * @type {string} */
    const payloadString = req.payload?.toString('utf8');
    try {
    	req.payload = JSON.parse(payloadString);
    } catch (e) {
        context.log('error', 'xero-plugin-route-webhook-invalid-payload');
        return h.response().code(200);
    }

    // Validates the payload with the Xero-signature hash
    const signature = req.headers['x-xero-signature'];
    const webhookKey = context.config?.webhookKey;
    if (!webhookKey) {
        context.log('error', 'xero-plugin-route-webhook-missing-key');
        return h.response(undefined).code(401);
    }
    const hash = crypto.createHmac('sha256', webhookKey).update(payloadString).digest('base64');
    if (signature !== hash) {
        context.log('debug', 'xero-plugin-route-webhook-invalid-signature', { config: context.config });
        context.log('error', 'xero-plugin-route-webhook-invalid-signature', { signature, hash });
        return h.response(undefined).code(401);
    }

    context.log('debug', 'xero-plugin-route-webhook-payload', { payload: req.payload });

    const tenantIds = [...new Set(req.payload.events?.map(event => event.tenantId))];
    /**
	 * Combination of eventType and eventCategory
	 * @example ['CONTACT.CREATE', 'INVOICE.CREATE', 'CONTACT.UPDATE'];
	 * @type {string[]} */
    const triggerTypes = [...new Set(req.payload.events.flatMap(event => {
        return `${event.eventCategory}.${event.eventType}`;
    }))];
    context.log('debug', 'xero-plugin-route-webhook-log', { tenantIds, triggerTypes, events: req.payload.events.length });

    let totalEventCount = 0;
    for (const tenantId of tenantIds) {
        for (const triggerType of triggerTypes) {
            const eventName = `${triggerType}:${tenantId}`;
            // Send only resourceIds as array of strings.
            const payload = req.payload.events
                .filter(event => `${event.eventCategory}.${event.eventType}` === triggerType && event.tenantId === tenantId)
                .map(event => event.resourceId);
            const eventCount = payload.length;
            totalEventCount += eventCount;
            if (eventCount === 0) {
                continue;
            }
            await context.triggerListeners({
                eventName,
                payload
            });
            await context.log('info', 'xero-plugin-route-webhook-trigger-ok', { tenantId, triggerType });
        }
    }

    context.log('info', 'xero-plugin-route-webhook-success', { totalEventCount });

    // Empty response
    return h.response(undefined).code(200);
};
