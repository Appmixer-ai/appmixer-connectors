'use strict';

const lib = require('./lib');
const soap = require('./soap');

// The one endpoint SiteMinder Exchange pushes reservations to:
//   POST <API_BASE>/plugins/appmixer/siteminder/reservations
//
// SiteMinder allows a single endpoint and a single username/password per partner application, for
// all of its hotels. Each message is a SOAP 1.1 envelope with a WS-Security UsernameToken and one
// OTA_HotelResNotifRQ, and SiteMinder waits for OTA_HotelResNotifRS in the same request
// (https://developer.siteminder.com/smx-api/reference/reservations). It retries a failed delivery
// only 3 times, 30 seconds apart, so the handler answers as soon as the event is stored and the
// flows run afterwards.
//
// Who gets a message is decided by two things, both required:
// 1. the credentials in the message must equal the endpoint credentials of the account behind a
//    running reservation trigger (compared as hashes, in constant time), and
// 2. the HotelCode of the reservation must be one of the hotel codes that trigger lists.
// A listener that fails either check never sees the message. There is no "everyone" fallback.

const XML_CONTENT_TYPE = 'application/xml; charset=utf-8';

/**
 * The hotel codes of a stored listener.
 * @param {object} listener
 * @returns {string[]}
 */
const hotelCodesOf = (listener) => {

    const codes = listener && listener.params && listener.params.hotelCodes;
    return Array.isArray(codes) ? codes : [];
};

/**
 * Handle one pushed message. Kept apart from the route registration so that it can be tested
 * without an HTTP server.
 * @param {object} context plugin context
 * @param {Buffer|string} payload the raw request body
 * @returns {Promise<{ statusCode: number, body: string }>}
 */
const handleNotification = async (context, payload) => {

    let notification;
    try {
        notification = soap.parseNotification(payload);
    } catch (err) {
        if (err instanceof soap.SoapFaultError) {
            // SOAP 1.1 over HTTP: a fault is sent with status 500.
            return { statusCode: 500, body: soap.faultResponse({ code: 'Client', message: err.message }) };
        }
        throw err;
    }

    const { echoToken } = notification;
    const otaError = (error, text) => ({
        statusCode: 200,
        body: soap.errorResponse({ echoToken, type: error.type, code: error.code, text: text || error.text })
    });

    // 1. Credentials. Every listener is compared, without an early exit.
    const hasCredentials = typeof notification.username === 'string' && typeof notification.password === 'string'
        && (notification.passwordType === undefined || notification.passwordType === soap.PASSWORD_TEXT_TYPE);
    const presented = lib.credentialHash(notification.username || '', notification.password || '');
    const listeners = (await context.getListeners(lib.RESERVATION_EVENT)) || [];
    const isAuthorized = (listener) => {
        const stored = listener && listener.params && listener.params.credentialHash;
        return lib.safeEqual(stored, presented) && hasCredentials;
    };
    const authorized = listeners.filter(isAuthorized);
    if (!authorized.length) {
        return otaError(soap.ERROR_INVALID_CREDENTIALS);
    }

    // 2. The message itself.
    if (!notification.reservations.length) {
        return otaError(soap.ERROR_REQUIRED_FIELD_MISSING, 'HotelReservation is missing');
    }
    for (const reservation of notification.reservations) {
        if (!reservation.reservationId) {
            return otaError(soap.ERROR_REQUIRED_FIELD_MISSING, 'UniqueID is missing');
        }
        if (!reservation.hotelCode) {
            return otaError(soap.ERROR_REQUIRED_FIELD_MISSING, 'HotelCode is missing');
        }
    }

    // 3. The hotel. Checked for every reservation before anything is delivered: a message is
    // processed entirely or not at all.
    for (const reservation of notification.reservations) {
        if (!authorized.some(listener => hotelCodesOf(listener).includes(reservation.hotelCode))) {
            return otaError(soap.ERROR_HOTEL_NOT_FOUND, `Hotel not found for HotelCode=${reservation.hotelCode}`);
        }
    }

    // 4. Hand over. triggerListeners stores the event; the engine delivers it to the flows after
    // this request has been answered.
    for (const reservation of notification.reservations) {
        await context.triggerListeners({
            eventName: lib.RESERVATION_EVENT,
            payload: {
                ...reservation,
                eventType: lib.classifyReservation(reservation),
                // Checked by the trigger; see lib.deliveryProof().
                deliveryProof: lib.deliveryProof(notification.username, notification.password, reservation)
            },
            filter: listener => isAuthorized(listener) && hotelCodesOf(listener).includes(reservation.hotelCode)
        });
    }

    return {
        statusCode: 200,
        body: soap.successResponse({
            echoToken,
            reservationIds: notification.reservations.map(reservation => reservation.reservationId)
        })
    };
};

module.exports = (context) => {

    // A listener without a credential hash and hotel codes could never be matched safely, so it
    // is refused when a trigger registers it.
    context.onListenerAdded(async (listener) => {

        const params = (listener && listener.params) || {};
        if (typeof params.credentialHash !== 'string' || !/^[0-9a-f]{64}$/.test(params.credentialHash)) {
            throw new Error('SiteMinder listener requires the hash of the endpoint credentials.');
        }
        if (!Array.isArray(params.hotelCodes) || !params.hotelCodes.length
            || params.hotelCodes.some(code => typeof code !== 'string' || !code)) {
            throw new Error('SiteMinder listener requires at least one hotel code.');
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/reservations',
        options: {
            auth: false,
            payload: {
                // The body is read as a buffer and parsed in soap.js; hapi must not parse it.
                parse: false,
                output: 'data',
                maxBytes: soap.MAX_XML_BYTES,
                allow: ['application/xml', 'text/xml']
            },
            handler: async (req, h) => {

                let result;
                try {
                    result = await handleNotification(context, req.payload);
                } catch (err) {
                    // Nothing of the message is logged: it holds guest data and the credentials.
                    await context.log('error', 'siteminder-reservation-delivery-failed', {
                        error: err && err.message
                    });
                    // A server-level failure. SiteMinder retries the delivery.
                    result = {
                        statusCode: 500,
                        body: soap.faultResponse({ code: 'Server', message: 'The reservation could not be processed.' })
                    };
                }
                return h.response(result.body).type(XML_CONTENT_TYPE).code(result.statusCode);
            }
        }
    });
};

module.exports.handleNotification = handleNotification;
