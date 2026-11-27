'use strict';

const lib = require('./lib');

// The endpoint IDeaS reports processing results to: the URL a Send component puts into the
// "ReplyTo" header of its request (lib.buildReplyUrl()):
//   <API_BASE>/plugins/appmixer/ideas/reply/<flowId>/<componentId>/trackers/<replyToken>
//
// The documentation describes the callback twice: as "REST PUT callback by ReplyTo URL" with
// { status, description } (message flow diagram, https://developers.ideas.com/developer-guide/request/)
// and as "POST /trackers/{trackerId}" with { status, messages[] } (Tracker API,
// https://developers.ideas.com/tracker-api/operations/trackerstrackerid). Whether IDeaS calls the
// ReplyTo URL as it is or appends "/trackers/<trackerId>" to it is not documented, so both PUT and
// POST are accepted, on the URL as it is and with "/trackers/<trackerId>" appended.
//
// IDeaS documents no signature or credential on this call. The reply token in the path is what
// authenticates it, and it is checked by the component, with the client secret of its own
// account (lib.receiveReply()). This route only reads which message of which flow the reply
// continues and hands it over; it never sends anything on by itself. The component's own webhook
// URL is just as reachable as this route, which is why the check lives in the component: a request
// posted there directly gets the same 404 as a forged one here.

const MAX_BODY_BYTES = 1024 * 1024;
const METHODS = ['POST', 'PUT'];
const PATHS = [
    '/reply/{flowId}/{componentId}/trackers/{token}',
    '/reply/{flowId}/{componentId}/trackers/{token}/trackers/{trackerId}'
];

const NOT_FOUND = { statusCode: 404, body: { message: 'Tracker not found.' } };

/**
 * Handle one reply. Kept apart from the route registration so that it can be tested without an
 * HTTP server.
 * @param {object} context plugin context
 * @param {{ params: object, payload: * }} request
 * @returns {Promise<{ statusCode: number, body: * }>}
 */
const handleReply = async (context, { params, payload }) => {

    const { flowId, componentId, token, trackerId } = params || {};
    if (!lib.ID_PATTERN.test(String(flowId || '')) || !lib.ID_PATTERN.test(String(componentId || ''))) {
        return NOT_FOUND;
    }
    // Read, not verified: the route has no account. The component verifies it.
    const decoded = lib.decodeReplyToken(token);
    if (!decoded) {
        await context.log('warn', 'ideas-reply-rejected', { reason: 'malformed' });
        return NOT_FOUND;
    }
    let body = payload;
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
        // Sent as text/plain: read it as JSON if it is; the component answers 400 otherwise.
        try {
            body = JSON.parse(body.toString());
        } catch (err) {
            body = null;
        }
    }
    const query = {};
    for (const [name, key] of [['correlationId', 'c'], ['correlationInPort', 'p'], ['messageId', 'm']]) {
        if (typeof decoded[key] === 'string' && decoded[key]) {
            query[name] = decoded[key];
        }
    }

    let result;
    try {
        result = await context.triggerComponent(flowId, componentId, {
            ideasReply: {
                token,
                trackerId: typeof trackerId === 'string' ? trackerId : '',
                body
            }
        }, query, {});
    } catch (err) {
        // A stopped or deleted flow, or a component that no longer exists.
        await context.log('warn', 'ideas-reply-undeliverable', { error: err && err.message });
        return NOT_FOUND;
    }
    if (!result || (result.statusCode === 400 && result.body && result.body.message === 'Flow stopped.')) {
        // The engine's answer for a stopped flow. To IDeaS a 400 means "Invalid input".
        return NOT_FOUND;
    }
    return {
        statusCode: result.statusCode || 200,
        body: result.body !== undefined ? result.body : {}
    };
};

module.exports = (context) => {

    for (const method of METHODS) {
        for (const path of PATHS) {
            context.http.router.register({
                method,
                path,
                options: {
                    auth: false,
                    payload: {
                        parse: true,
                        output: 'data',
                        maxBytes: MAX_BODY_BYTES,
                        // IDeaS documents application/json; text/plain is read as JSON too, so
                        // that a result is not lost to a 415 for its content type.
                        allow: ['application/json', 'text/plain']
                    },
                    handler: async (req, h) => {

                        let result;
                        try {
                            result = await handleReply(context, { params: req.params, payload: req.payload });
                        } catch (err) {
                            // Nothing of the request is logged: the path holds the reply token.
                            await context.log('error', 'ideas-reply-failed', { error: err && err.message });
                            result = { statusCode: 500, body: { message: 'The result could not be processed.' } };
                        }
                        return h.response(result.body).type('application/json').code(result.statusCode);
                    }
                }
            });
        }
    }
};

module.exports.handleReply = handleReply;
