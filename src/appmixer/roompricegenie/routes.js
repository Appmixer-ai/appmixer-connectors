'use strict';

const crypto = require('crypto');
const lib = require('./lib');
const jwt = require('./jwt');

// The one endpoint RoomPriceGenie pushes to:
//   POST <API_BASE>/plugins/appmixer/roompricegenie/events
//
// RoomPriceGenie sends everything for all properties of a partner to a single fixed URL
// (https://postman.roompricegenie.com/, "RoomPriceGenie Price Updates"): rates.update,
// restrictions.update and public_key. Each request carries the partner's X-API-Key and a Bearer
// JWT signed by RoomPriceGenie, and expects 200 with the same tracking_id.
//
// What a request has to pass, in this order:
// 1. X-API-Key equals the Partner API Key of the connector configuration.
// 2. The Bearer token is an RS256 JWT signed with a key of the configured RoomPriceGenie host,
//    issued by "RoomPriceGenie", not expired, and (when partnerId is configured) for this partner.
// 3. For an update: the token's audience contains the property code of the body.
// 4. A running trigger listens for that property code with the client id named in the token.
// Only then is anything handed to a flow. There is no switch that skips a step.

const ISSUER = 'RoomPriceGenie';
const UPDATE_EVENTS = [lib.RATES_EVENT, lib.RESTRICTIONS_EVENT];
const MAX_BODY_BYTES = 10 * 1024 * 1024;
const JWKS_TIMEOUT = 10 * 1000;

// One key store per host and Partner API Key, kept for the life of the process.
const keyStores = new Map();

const keyStoreFor = (context, config) => {

    const id = crypto.createHash('sha256').update(JSON.stringify([config.origin, config.partnerApiKey])).digest('hex');
    if (!keyStores.has(id)) {
        keyStores.set(id, jwt.createKeyStore({
            fetch: async () => {
                // The URL is the configured, checked host plus a fixed path. Nothing of a request
                // or a token ever goes into it.
                const response = await context.httpRequest({
                    method: 'GET',
                    url: config.origin + lib.JWKS_PATH,
                    headers: { Accept: 'application/json', 'X-API-Key': config.partnerApiKey },
                    maxRedirects: 0,
                    timeout: JWKS_TIMEOUT
                });
                return response && response.data;
            }
        }));
    }
    return keyStores.get(id);
};

const text = (value) => (typeof value === 'string' ? value : undefined);

/**
 * An answer in the shape of RoomPriceGenie's own error messages.
 * @param {number} statusCode
 * @param {object} body the request body, as far as it could be read
 * @param {{ type: string, loc?: string, msg: string }} error
 * @returns {{ statusCode: number, body: object }}
 */
const failure = (statusCode, body, { type, loc, msg }) => {

    const envelope = {};
    for (const key of ['event', 'tracking_id', 'property_code']) {
        if (lib.isPlainObject(body) && typeof body[key] === 'string') {
            envelope[key] = body[key].slice(0, 200);
        }
    }
    return {
        statusCode,
        body: { ...envelope, errors: [{ type, ...(loc ? { loc } : {}), msg, input: null }] }
    };
};

const header = (headers, name) => {

    const value = headers && headers[name];
    return typeof value === 'string' ? value : undefined;
};

/**
 * Handle one pushed request. Kept apart from the route registration so that it can be tested
 * without an HTTP server.
 * @param {object} context plugin context
 * @param {{ headers: object, payload: * }} request headers with lower-case names
 * @returns {Promise<{ statusCode: number, body: object }>}
 */
const handleEvent = async (context, { headers, payload }) => {

    let config;
    try {
        config = lib.serviceConfig({ config: context.config });
    } catch (err) {
        await context.log('error', 'roompricegenie-endpoint-not-configured', { error: err.message });
        return failure(503, payload, { type: 'not_configured', msg: 'The endpoint is not configured.' });
    }

    const unauthorized = async (reason) => {
        // Neither the token nor the key is logged.
        await context.log('warn', 'roompricegenie-event-rejected', { reason });
        return failure(401, payload, { type: 'unauthorized', msg: 'Invalid or missing credentials.' });
    };

    // 1. The Partner API Key. Checked first: a caller without it cannot make this endpoint fetch
    // signing keys from RoomPriceGenie.
    if (!lib.safeEqual(header(headers, 'x-api-key'), config.partnerApiKey)) {
        return unauthorized('api_key');
    }

    // 2. The signed token.
    const authorization = header(headers, 'authorization') || '';
    const match = /^Bearer +([^\s]+)$/i.exec(authorization.trim());
    if (!match) {
        return unauthorized('no_bearer_token');
    }
    const keyStore = keyStoreFor(context, config);
    let claims;
    try {
        claims = await jwt.verify(match[1], { getKey: kid => keyStore.getKey(kid), issuer: ISSUER });
    } catch (err) {
        if (err instanceof jwt.JwtError) {
            return unauthorized(err.code);
        }
        // The key set could not be fetched: nothing can be verified right now.
        await context.log('error', 'roompricegenie-signing-keys-unavailable', { error: err && err.message });
        return failure(503, payload, { type: 'unavailable', msg: 'The request cannot be verified right now.' });
    }
    if (config.partnerId && String(claims.sub) !== config.partnerId) {
        return unauthorized('partner');
    }

    // 3. The body.
    if (!lib.isPlainObject(payload) || !text(payload.event) || !text(payload.tracking_id)) {
        return failure(400, payload, { type: 'missing', loc: 'event', msg: 'event and tracking_id are required.' });
    }
    const event = payload.event;
    const trackingId = payload.tracking_id;

    if (event === lib.PUBLIC_KEY_EVENT) {
        // The keys in the notice are not taken over: the key set is read again from RoomPriceGenie.
        try {
            await keyStore.refresh();
        } catch (err) {
            await context.log('warn', 'roompricegenie-signing-keys-refresh-failed', { error: err && err.message });
        }
        return { statusCode: 200, body: {} };
    }

    if (!UPDATE_EVENTS.includes(event)) {
        return failure(400, payload, { type: 'unsupported_event', loc: 'event', msg: `Unsupported event "${event.slice(0, 80)}".` });
    }

    const propertyCode = text(payload.property_code);
    if (!propertyCode) {
        return failure(400, payload, { type: 'missing', loc: 'property_code', msg: 'Field required' });
    }
    if (!Array.isArray(payload.data) || payload.data.some(entry => !lib.isPlainObject(entry))) {
        return failure(400, payload, { type: 'list_type', loc: 'data', msg: 'Input should be a list of objects' });
    }
    // The token must be about the property the body names.
    if (!jwt.audiences(claims).includes(propertyCode)) {
        return unauthorized('audience');
    }

    // 4. The flows. A listener matches when it was registered for this property code with the
    // client id of the token, so no other connection of this Appmixer tenant sees the update.
    const clientId = text(claims.client_id);
    const matches = (listener) => {
        const params = (listener && listener.params) || {};
        return Boolean(clientId) && params.propertyCode === propertyCode && params.clientId === clientId;
    };
    const listeners = ((await context.getListeners(event)) || []).filter(matches);
    if (!listeners.length) {
        return failure(404, payload, {
            type: 'property_not_found',
            loc: 'property_code',
            msg: 'No running integration receives this event for the property.'
        });
    }

    // One message per item of "data" (a room type, or a room type and rate plan): a full upload of
    // 18 months for a whole hotel would not fit into one flow message. triggerListeners stores the
    // event; the engine delivers it to the flows after this request has been answered.
    const count = payload.data.length;
    for (let index = 0; index < count; index++) {
        // eslint-disable-next-line no-unused-vars
        const { deliveryProof: ignored, ...entry } = payload.data[index];
        const update = {
            ...entry,
            event,
            tracking_id: trackingId,
            property_code: propertyCode,
            index,
            count
        };
        await context.triggerListeners({
            eventName: event,
            // Checked by the trigger; see lib.deliveryProof().
            payload: { ...update, deliveryProof: lib.deliveryProof(config.partnerApiKey, clientId, update) },
            filter: matches
        });
    }

    return { statusCode: 200, body: { event, tracking_id: trackingId, property_code: propertyCode } };
};

module.exports = (context) => {

    // A listener without a property code and a client id could never be matched safely, so it is
    // refused when a trigger registers it.
    context.onListenerAdded(async (listener) => {

        const params = (listener && listener.params) || {};
        if (typeof params.propertyCode !== 'string' || !params.propertyCode
            || typeof params.clientId !== 'string' || !params.clientId) {
            throw new Error('RoomPriceGenie listener requires a property code and a client id.');
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/events',
        options: {
            auth: false,
            payload: {
                parse: true,
                output: 'data',
                maxBytes: MAX_BODY_BYTES,
                allow: ['application/json']
            },
            handler: async (req, h) => {

                let result;
                try {
                    result = await handleEvent(context, { headers: req.headers, payload: req.payload });
                } catch (err) {
                    // Nothing of the request is logged: it holds prices and the credentials.
                    await context.log('error', 'roompricegenie-event-delivery-failed', { error: err && err.message });
                    result = { statusCode: 500, body: { errors: [{ type: 'server_error', msg: 'The event could not be processed.', input: null }] } };
                }
                return h.response(result.body).type('application/json').code(result.statusCode);
            }
        }
    });
};

module.exports.handleEvent = handleEvent;
// For tests: the key stores live for the life of the process.
module.exports.resetKeyStores = () => keyStores.clear();
