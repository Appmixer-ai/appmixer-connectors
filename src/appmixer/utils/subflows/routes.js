'use strict';

const crypto = require('crypto');
const baseX = require('base-x').default;
const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const base62 = baseX(BASE62_ALPHABET);
const { CallbackError, resolveCallerWebhook, verifyCallerWebhook } = require('./callerWebhook');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = (context) => {

    const config = require('./config')(context);
    const CallModel = require('./CallModel')(context);

    // Input definition (OnFlowCall).

    context.http.router.register({
        method: 'POST',
        path: '/input/{flowId}/{componentId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { flowId, componentId } = req.params;
                const input = req.payload;
                input.createdAt = new Date();
                input.flowId = flowId;
                input.componentId = componentId;
                await context.service.stateSet(`subflows:input:${flowId}:${componentId}`, input);
                return {};
            }
        }
    });

    context.http.router.register({
        method: 'GET',
        path: '/input/{flowId}/{componentId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { flowId, componentId } = req.params;
                const input = await context.service.stateGet(`subflows:input:${flowId}:${componentId}`);
                return input;
            }
        }
    });

    // Output definition (FlowCallOutput).

    context.http.router.register({
        method: 'POST',
        path: '/output/{flowId}/{componentId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { flowId, componentId } = req.params;
                const output = req.payload;
                output.flowId = flowId;
                output.componentId = componentId;
                output.createdAt = new Date();
                await context.service.stateSet(`subflows:output:${flowId}`, output);
                return {};
            }
        }
    });

    context.http.router.register({
        method: 'GET',
        path: '/output/{flowId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { flowId } = req.params;
                const output = await context.service.stateGet(`subflows:output:${flowId}`);
                return output;
            }
        }
    });

    // Trigger callee flow (i.e. trigger the OnFlowCall component).

    context.http.router.register({
        method: 'POST',
        path: '/trigger/{calleeFlowId}/{calleeComponentId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { calleeFlowId, calleeComponentId } = req.params;
                const {
                    callerWebhookUrl,
                    payload
                } = req.payload;

                // The correlationId lets FlowCallOutput call back this CallFlow component (see /callback).
                // It is a UUID: the engine keeps it on every message of the called flow and AMQP limits
                // a correlationId to 255 characters. The caller's webhook URL stays on the server.
                const correlationId = crypto.randomUUID();
                const now = new Date();
                await new CallModel().populate({
                    id: correlationId,
                    callerWebhookUrl,
                    calleeFlowId,
                    calleeComponentId,
                    createdAt: now,
                    expiresAt: new Date(now.getTime() + config.callTTL * 1000)
                }).save();

                try {
                    await context.triggerComponent(
                        calleeFlowId,
                        calleeComponentId,
                        payload,
                        { enqueueOnly: 'true', correlationId }
                    );
                } catch (err) {
                    await CallModel.deleteMany({ id: correlationId });
                    throw err;
                }

                return {
                    correlationId
                };
            }
        }
    });

    // Send flow output back to the caller. This is called by FlowCallOutput (context.callAppmixer
    // sends the user token), so the route is not public. The correlation ID is a UUID mapped to the
    // webhook URL of the CallFlow component by /trigger (or, from subflows <= 1.2.x, the base62 encoded
    // URL itself). The engine POSTs to that URL, so it is accepted only when it is the webhook of a
    // CallFlow component of this instance in a flow owned by the caller.

    context.http.router.register({
        method: 'POST',
        path: '/callback',
        options: {
            auth: {
                strategies: ['jwt-strategy']
            },
            handler: async (req, h) => {

                const { correlationId, payload } = req.payload || {};

                let callerWebhookUrl;
                try {
                    if (typeof correlationId === 'string' && UUID_REGEX.test(correlationId)) {
                        // The caller is looked up on the server, never taken from the request. It is
                        // verified like a legacy one: /trigger is reachable without a token, so the stored
                        // URL is not trusted either.
                        const call = await CallModel.findOne({ id: correlationId });
                        if (!call || !call.expiresAt || new Date(call.expiresAt) <= new Date()) {
                            throw new CallbackError('Unknown or expired correlationId.', 404);
                        }
                        callerWebhookUrl = await verifyCallerWebhook(context, req, call.callerWebhookUrl);
                    } else {
                        // Legacy base62 correlation ID of a call started before the upgrade.
                        callerWebhookUrl = await resolveCallerWebhook(context, req, correlationId, base62.decode);
                    }
                } catch (err) {
                    if (err instanceof CallbackError) {
                        context.log('error', `[UTILS.SUBFLOWS] Callback rejected: ${err.message}`);
                        return h.response({ error: err.message }).code(err.statusCode);
                    }
                    throw err;
                }

                // The record is kept until it expires: a called flow may reach FlowCallOutput more than once.
                await context.httpRequest({
                    method: 'POST',
                    url: callerWebhookUrl,
                    data: payload,
                    maxRedirects: 0
                });
                return {};
            }
        }
    });
};
