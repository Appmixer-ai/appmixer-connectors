'use strict';

// Validation of the CallFlow webhook URL carried in the correlation ID of a subflow call.
// The /callback route POSTs the callee flow output to this URL, so it must never be an
// arbitrary address: only the webhook of a CallFlow component of this Appmixer instance,
// in a flow that belongs to the user who calls the route.

const CALL_FLOW_TYPE = 'appmixer.utils.subflows.CallFlow';
const WEBHOOK_PATH = /^\/flows\/([^/]+)\/components\/([^/]+)$/;

class CallbackError extends Error {

    constructor(message, statusCode) {

        super(message);
        this.name = 'CallbackError';
        this.statusCode = statusCode;
    }
}

function decodePathSegment(segment) {

    let value;
    try {
        value = decodeURIComponent(segment);
    } catch (err) {
        throw new CallbackError('Invalid caller webhook URL.', 400);
    }
    if (!value || value === '.' || value === '..' || /[/\\]/.test(value)) {
        throw new CallbackError('Invalid caller webhook URL.', 400);
    }
    return value;
}

/**
 * Parse the caller webhook URL and check that it points to a component webhook
 * (`<appmixerApiUrl>/flows/{flowId}/components/{componentId}`) of this instance.
 * Returns the flow and component ID and the URL rebuilt from the instance base URL.
 */
function parseCallerWebhookUrl(context, callerWebhookUrl) {

    if (!context.appmixerApiUrl) {
        throw new CallbackError('Appmixer API URL is not configured.', 500);
    }

    let base;
    let url;
    try {
        base = new URL(context.appmixerApiUrl);
        url = new URL(callerWebhookUrl);
    } catch (err) {
        throw new CallbackError('Invalid caller webhook URL.', 400);
    }

    if (url.origin !== base.origin || url.username || url.password) {
        throw new CallbackError('Caller webhook URL does not point to this Appmixer instance.', 400);
    }

    const basePath = base.pathname.replace(/\/+$/, '');
    if (!url.pathname.startsWith(basePath + '/')) {
        throw new CallbackError('Caller webhook URL does not point to this Appmixer instance.', 400);
    }

    const match = url.pathname.slice(basePath.length).match(WEBHOOK_PATH);
    if (!match) {
        throw new CallbackError('Caller webhook URL is not a component webhook.', 400);
    }

    const flowId = decodePathSegment(match[1]);
    const componentId = decodePathSegment(match[2]);

    return {
        flowId,
        componentId,
        url: base.origin + basePath +
            `/flows/${encodeURIComponent(flowId)}/components/${encodeURIComponent(componentId)}` +
            url.search
    };
}

/**
 * Check that a caller webhook URL is the webhook of a CallFlow component of this instance in a
 * flow owned by the authenticated user, and return it rebuilt from the instance base URL.
 * Throws CallbackError otherwise.
 */
async function verifyCallerWebhook(context, req, callerWebhookUrl) {

    if (!callerWebhookUrl || typeof callerWebhookUrl !== 'string') {
        throw new CallbackError('Invalid caller webhook URL.', 400);
    }

    const target = parseCallerWebhookUrl(context, callerWebhookUrl);

    const flow = await context.db.coreCollection('flows').findOne(
        { flowId: target.flowId },
        { projection: { userId: 1, flow: 1 } }
    );
    if (!flow) {
        throw new CallbackError('Caller flow not found.', 404);
    }

    const component = flow.flow && Object.prototype.hasOwnProperty.call(flow.flow, target.componentId)
        ? flow.flow[target.componentId]
        : null;
    if (!component || component.type !== CALL_FLOW_TYPE) {
        throw new CallbackError('Caller webhook URL is not a Call Flow component.', 400);
    }

    const user = await context.http.auth.getUser(req);
    const userId = user && user.getId();
    if (!userId || String(flow.userId) !== String(userId)) {
        throw new CallbackError('Caller flow does not belong to the user.', 403);
    }

    return target.url;
}

/**
 * Resolve a legacy correlation ID (subflows <= 1.2.x: the base62 encoded webhook URL of the
 * calling CallFlow component) and verify it like any other caller webhook URL.
 * @deprecated Remove once no call triggered by subflows <= 1.2.x can still be running.
 */
async function resolveCallerWebhook(context, req, correlationId, decode) {

    if (!correlationId || typeof correlationId !== 'string') {
        throw new CallbackError('Missing correlationId.', 400);
    }

    let callerWebhookUrl;
    try {
        callerWebhookUrl = Buffer.from(decode(correlationId)).toString('utf8');
    } catch (err) {
        throw new CallbackError('Invalid correlationId.', 400);
    }

    return verifyCallerWebhook(context, req, callerWebhookUrl);
}

module.exports = {
    CALL_FLOW_TYPE,
    CallbackError,
    parseCallerWebhookUrl,
    verifyCallerWebhook,
    resolveCallerWebhook
};
