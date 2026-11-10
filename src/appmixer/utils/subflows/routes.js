'use strict';

const crypto = require('crypto');
const baseX = require('base-x').default;
const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const base62 = baseX(BASE62_ALPHABET);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/**
 * Legacy correlation IDs (subflows <= 1.2.1) are the base62 encoded webhook URL of the CallFlow component.
 * Accept them only for calls triggered before the upgrade, and only when the URL points to a component
 * webhook of this tenant's own API. Returns the URL or null.
 * @deprecated Remove in a later version, once no call triggered by subflows <= 1.2.1 can still be running.
 */
function resolveLegacyCallerUrl(correlationId, appmixerApiUrl) {

    if (!appmixerApiUrl || typeof correlationId !== 'string' || !/^[0-9a-zA-Z]+$/.test(correlationId)) {
        return null;
    }
    try {
        const url = new URL(Buffer.from(base62.decode(correlationId)).toString('utf8'));
        const api = new URL(appmixerApiUrl);
        const basePath = api.pathname.replace(/\/+$/, '');
        const pathRegex = new RegExp(`^${escapeRegex(basePath)}/flows/${UUID_PATTERN}/components/[\\w-]+$`, 'i');
        if (url.origin !== api.origin || url.username || url.password || !pathRegex.test(url.pathname)) {
            return null;
        }
        return url.toString();
    } catch (err) {
        return null;
    }
}

function escapeRegex(str) {

    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

    // Send flow output back to the caller. This is called by FlowCallOutput.

    context.http.router.register({
        method: 'POST',
        path: '/callback',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req, h) => {

                const { correlationId, payload } = req.payload || {};
                if (!correlationId || typeof correlationId !== 'string') {
                    return h.response({ error: 'Missing correlationId.' }).code(400);
                }

                let callerWebhookUrl = null;
                if (UUID_REGEX.test(correlationId)) {
                    // The caller is looked up on the server, never taken from the request.
                    const call = await CallModel.findOne({ id: correlationId });
                    if (call && call.expiresAt && new Date(call.expiresAt) > new Date()) {
                        callerWebhookUrl = call.callerWebhookUrl;
                    }
                } else {
                    callerWebhookUrl = resolveLegacyCallerUrl(correlationId, context.appmixerApiUrl);
                }

                if (!callerWebhookUrl) {
                    return h.response({ error: 'Unknown or expired correlationId.' }).code(404);
                }

                // The record is kept until it expires: a called flow may reach FlowCallOutput more than once.
                await context.httpRequest({
                    method: 'POST',
                    url: callerWebhookUrl,
                    data: payload
                });
                return {};
            }
        }
    });
};

module.exports.resolveLegacyCallerUrl = resolveLegacyCallerUrl;
