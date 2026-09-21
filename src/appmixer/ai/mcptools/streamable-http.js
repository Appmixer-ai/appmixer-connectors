'use strict';

/**
 * streamable-http.js — MCP protocol layer for the remote (Streamable HTTP) endpoint.
 *
 * This is the same tool surface the stdio `appmixer-mcp` server exposes, moved
 * server-side. `appmixer-mcp` runs on a developer machine, reads the user's
 * gateways over the REST API and calls gateway webhooks itself; a serverless
 * function on Vercel can do neither. Since the gateway registry
 * (`mcpgateways:user:<userId>`) and the webhooks both already live in the
 * backend, the shortest path to a remote endpoint is to answer JSON-RPC here
 * and skip the round trip entirely.
 *
 * Deliberately stateless: no `Mcp-Session-Id` is issued, so any node in the
 * cluster can serve any request and no sticky session store is needed. The spec
 * allows this — a server that never returns a session id is never sent one.
 *
 * Scope: this serves the *authenticated user's own* gateways, matching stdio
 * behaviour. Multi-tenant (integration instances) and catalogue-mode discovery
 * are follow-ups, see the module README.
 */

const bundle = require('./bundle.json');

const LATEST_PROTOCOL_VERSION = '2025-06-18';
// Ordered newest first; used to negotiate in initialize and to validate the
// MCP-Protocol-Version header on subsequent requests.
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const JSONRPC_VERSION = '2.0';

// JSON-RPC 2.0 error codes.
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

const DEFAULT_TOOL_CALL_TIMEOUT = 120000;

const SERVER_INFO = {
    name: 'Appmixer',
    title: 'Appmixer',
    version: bundle.version
};

const INSTRUCTIONS = 'Tools exposed by the MCP Gateway components in your running Appmixer flows. '
    + 'Each tool runs the Appmixer component wired to a gateway\'s "tool" port. '
    + 'The tool list changes as flows are started and stopped.';

// ─── JSON-RPC helpers ─────────────────────────────────────────────────────────

function success(id, result) {
    return { jsonrpc: JSONRPC_VERSION, id, result };
}

function failure(id, code, message, data) {
    const error = { code, message };
    if (data !== undefined) {
        error.data = data;
    }
    return { jsonrpc: JSONRPC_VERSION, id: id === undefined ? null : id, error };
}

function isSupportedProtocolVersion(version) {
    return SUPPORTED_PROTOCOL_VERSIONS.includes(version);
}

// ─── Tool listing ─────────────────────────────────────────────────────────────

async function getUserGateways(context, userId) {
    return (await context.service.stateGet(`mcpgateways:user:${userId}`)) || [];
}

/**
 * MCP requires `inputSchema` to be a JSON Schema object. Gateway tool defs omit
 * `parameters` entirely when the component has no model-defined fields, so a
 * parameterless tool has to be given an empty object schema rather than nothing.
 */
function normalizeInputSchema(parameters) {

    if (!parameters || typeof parameters !== 'object') {
        return { type: 'object', properties: {} };
    }
    const schema = { ...parameters };
    if (!schema.type) {
        schema.type = 'object';
    }
    if (schema.type === 'object' && !schema.properties) {
        schema.properties = {};
    }
    return schema;
}

/**
 * Tool names are `<shortComponentId>_<label>` — opaque and not meant for humans.
 * Drop the id prefix for the display title, same as the stdio server does.
 */
function deriveTitle(name) {
    const title = String(name).split('_').slice(1).join(' ').trim();
    return title || String(name);
}

function toMCPTool(toolDef) {

    const fn = toolDef.function || {};
    return {
        name: fn.name,
        title: deriveTitle(fn.name),
        description: fn.description || fn.name,
        inputSchema: normalizeInputSchema(fn.parameters)
    };
}

/**
 * Flatten every gateway's tools into one list. Names are unique per component,
 * so a clash across two gateways means the same flow is registered twice; keep
 * the first and drop the rest, because tools/call resolves strictly by name and
 * a duplicate would dispatch non-deterministically.
 */
async function listTools(context, userId) {

    const gateways = await getUserGateways(context, userId);
    const seen = new Set();
    const tools = [];

    for (const gateway of gateways) {
        for (const toolDef of gateway.tools || []) {
            const name = toolDef?.function?.name;
            if (!name || seen.has(name)) {
                continue;
            }
            seen.add(name);
            tools.push(toMCPTool(toolDef));
        }
    }
    return tools;
}

// ─── Tool execution ───────────────────────────────────────────────────────────

function textResult(text, isError) {
    return { content: [{ type: 'text', text }], isError: Boolean(isError) };
}

function describeHttpError(err) {

    const body = err?.response?.data;
    if (typeof body === 'string' && body.trim()) {
        return body;
    }
    if (body) {
        return JSON.stringify(body);
    }
    return err?.message || 'Unknown error';
}

/**
 * Dispatch a tool call to the gateway that owns the tool. The request body is
 * `{ function: { name, arguments } }` — the gateway webhook receives it as
 * `context.messages.webhook.content.data` and answers with the tool output as
 * the HTTP response body (see MCPGateway.receive).
 *
 * @returns {Promise<object|null>} MCP tool result, or null when no gateway owns
 *   the tool (the caller turns that into a JSON-RPC error).
 */
async function callTool(context, userId, name, args) {

    const gateways = await getUserGateways(context, userId);
    const gateway = gateways.find(candidate =>
        (candidate.tools || []).some(toolDef => toolDef?.function?.name === name));

    if (!gateway) {
        return null;
    }
    if (!gateway.webhook) {
        return textResult(`Tool ${name} is registered without a webhook URL and cannot be called.`, true);
    }

    try {
        const { data } = await context.httpRequest({
            method: 'POST',
            url: gateway.webhook,
            headers: { 'Content-Type': 'application/json' },
            data: { function: { name, arguments: args } },
            timeout: context.config?.MCP_TOOL_CALL_TIMEOUT || DEFAULT_TOOL_CALL_TIMEOUT
        });
        return textResult(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    } catch (err) {
        // A failing tool is a normal result, not a protocol error: reporting it
        // as `isError` lets the model see what went wrong and retry.
        context.log('error', `[AI.MCPTOOLS] Tool call ${name} failed: ${err.message}`);
        return textResult(`Error calling tool ${name}: ${describeHttpError(err)}`, true);
    }
}

// ─── Request dispatch ─────────────────────────────────────────────────────────

function handleInitialize(params) {

    const requested = params?.protocolVersion;
    const protocolVersion = isSupportedProtocolVersion(requested) ? requested : LATEST_PROTOCOL_VERSION;

    return {
        protocolVersion,
        // Only `tools` is advertised: the GET stream pushes tools/list_changed when
        // a flow starts or stops. No logging/prompts/resources are implemented.
        capabilities: { tools: { listChanged: true } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS
    };
}

async function handleToolsCall(context, userId, id, params) {

    const name = params?.name;
    if (typeof name !== 'string' || !name) {
        return failure(id, INVALID_PARAMS, 'Invalid params: "name" must be a non-empty string.');
    }

    const args = params.arguments === undefined || params.arguments === null ? {} : params.arguments;
    if (typeof args !== 'object' || Array.isArray(args)) {
        return failure(id, INVALID_PARAMS, 'Invalid params: "arguments" must be a JSON object.');
    }

    const result = await callTool(context, userId, name, args);
    if (result === null) {
        return failure(id, INVALID_PARAMS, `Unknown tool: ${name}`);
    }
    return success(id, result);
}

/**
 * Handle one JSON-RPC message.
 *
 * @returns {Promise<object|null>} the JSON-RPC response, or null for
 *   notifications and client responses (nothing to send back).
 */
async function handleMessage(context, { message, userId }) {

    if (!message || typeof message !== 'object' || Array.isArray(message)) {
        return failure(null, INVALID_REQUEST, 'Invalid Request: expected a JSON-RPC object.');
    }
    if (message.jsonrpc !== JSONRPC_VERSION) {
        return failure(message.id, INVALID_REQUEST, 'Invalid Request: "jsonrpc" must be "2.0".');
    }

    const { id, method, params } = message;

    // No method means this is a response to a server-issued request. We never
    // issue any, so there is nothing to correlate — acknowledge and drop.
    if (typeof method !== 'string') {
        return null;
    }

    // Notifications (no id) get acknowledged at the HTTP layer with 202.
    const isNotification = id === undefined || id === null;
    if (isNotification) {
        return null;
    }

    try {
        switch (method) {
            case 'initialize':
                return success(id, handleInitialize(params));
            case 'ping':
                return success(id, {});
            case 'tools/list':
                return success(id, { tools: await listTools(context, userId) });
            case 'tools/call':
                return handleToolsCall(context, userId, id, params);
            default:
                return failure(id, METHOD_NOT_FOUND, `Method not found: ${method}`);
        }
    } catch (err) {
        context.log('error', `[AI.MCPTOOLS] ${method} failed: ${err.message}`);
        return failure(id, INTERNAL_ERROR, `Internal error: ${err.message}`);
    }
}

module.exports = {
    INVALID_PARAMS,
    INVALID_REQUEST,
    INTERNAL_ERROR,
    LATEST_PROTOCOL_VERSION,
    METHOD_NOT_FOUND,
    SUPPORTED_PROTOCOL_VERSIONS,
    callTool,
    deriveTitle,
    failure,
    handleMessage,
    isSupportedProtocolVersion,
    listTools,
    normalizeInputSchema,
    success,
    toMCPTool
};
