'use strict';

/**
 * tool.js — "tool" output port: use any Appmixer action component or MCP server as an AI agent tool.
 *
 * This is intentionally separate from tools.js (which handles ToolStart chains wired to the
 * "tools" port). Components wired to the "tool" port are either:
 *
 *   - Regular action components: called synchronously via context.callAppmixer().
 *   - MCP servers: detected by component type (appmixer.mcpservers.*); tools are enumerated
 *     at runtime via mcpListTools and executed via mcpCallTool (see mcp.js).
 *
 * Parameter model (regular action components)
 * ───────────────────────────────────────────
 * The user marks fields they want the AI to fill with the "Model Defined Parameter" output
 * variable from the AI Agent (port "tool", option "modelDefinedParameter").  Only those
 * fields become parameters in the tool definition sent to the LLM.  Fields with a literal
 * user-set value are passed as static properties on every callAppmixer invocation.
 */

const { jsonSchema, tool } = require('ai');
const mcp = require('./mcp');

const TOOL_PORT = 'tool';

// Limit on what tools may add to the prompt. Tool results stay in the conversation for the
// rest of the turn (up to AI_AGENT_MAX_ATTEMPTS steps), so without a limit a single tool that
// returns a large list can exceed the model's context window. The limit is on all tool
// results of one turn together, so a single large result passes whole as long as the turn
// has room for it; results are cut only when the prompt would otherwise grow too long.
//
// The limit follows the model: a share of its context window, when the provider reports it
// (provider.getContextWindow), converted to characters. The rest of the window is left for
// the instructions, the memory, tool definitions and the answer.
const TOOL_RESULTS_CONTEXT_SHARE = 0.5;
// Characters per token, on the low side: JSON takes more tokens than prose.
const TOOL_RESULTS_CHARS_PER_TOKEN = 3;
// Used when the context window is not known. Fits a 128k-token model.
const AI_AGENT_MAX_TOOL_RESULTS_TOTAL_CHARS = 240000;
// Both can be set in the service configuration (context.config), in characters:
//   AI_AGENT_MAX_TOOL_RESULTS_TOTAL_CHARS  all tool results of one turn; overrides the
//                                          limit derived from the model
//   AI_AGENT_MAX_TOOL_RESULT_CHARS         one tool result; not set by default
// What is left for a result once the turn's total is used up: enough for the model to see
// that the tool worked and that it has to ask for less.
const TOOL_RESULT_MIN_CHARS = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isHandlebarsExpression(val) {
    return typeof val === 'string' && /\{\{.*?\}\}/.test(val);
}

// ─── Manifest fetching ────────────────────────────────────────────────────────

/**
 * Fetch the component manifest for a given fully-qualified component type.
 * Uses the public /components?selector=TYPE endpoint — no auth required.
 * Returns the first (and normally only) entry in the result array.
 */
async function fetchManifest(context, componentType) {
    const raw = await context.callAppmixer({
        endPoint: `/components?selector=${encodeURIComponent(componentType)}`,
        method: 'GET'
    });
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed[0] : parsed;
}

// ─── Discovery ────────────────────────────────────────────────────────────────

/**
 * Fetch manifests for all components wired to the agent's "tool" port and cache
 * them to state.  Called from AIAgent.start().
 *
 * MCP servers have no static manifest — they get a sentinel { _isMCP: true } entry
 * so buildDefsFromManifests knows to enumerate tools dynamically at call-time.
 */
async function fetchAndCacheManifests(context) {
    const flowDescriptor = context.flowDescriptor;
    const agentComponentId = context.componentId;
    const manifests = {};

    Object.keys(flowDescriptor).forEach((componentId) => {
        const component = flowDescriptor[componentId];
        const sources = component.source || {};
        Object.keys(sources).forEach((inPort) => {
            const source = sources[inPort];
            if (source[agentComponentId] && source[agentComponentId].includes(TOOL_PORT)) {
                manifests[componentId] = null;
            }
        });
    });

    for (const componentId of Object.keys(manifests)) {
        if (mcp.isMCPserver(context, componentId)) {
            // MCP servers expose dynamic tools — no static manifest to fetch.
            manifests[componentId] = { _isMCP: true };
            continue;
        }
        const otherType = flowDescriptor[componentId].type;
        try {
            manifests[componentId] = await fetchManifest(context, otherType);
        } catch (err) {
            await context.log({
                step: 'component-tool-manifest-error',
                componentId,
                type: otherType,
                error: err.message
            });
        }
    }

    await context.stateSet('componentToolManifests', manifests);
    return manifests;
}

/**
 * Build tool definitions from cached manifests + current flowDescriptor.
 *
 * For MCP servers the tool list is fetched fresh on each call (tools are dynamic).
 * For regular components, the cached manifest is used; fetches on-demand if missing.
 */
async function buildDefsFromManifests(context, manifests) {
    const flowDescriptor = context.flowDescriptor;
    const agentComponentId = context.componentId;
    const defs = [];

    for (const componentId of Object.keys(manifests)) {
        const manifest = manifests[componentId];

        // MCP server: enumerate tools dynamically via mcpListTools.
        if (manifest?._isMCP) {
            const mcpDefs = await buildMCPToolDefs(context, componentId);
            defs.push(...mcpDefs);
            continue;
        }

        const component = flowDescriptor[componentId];
        if (!component) continue;

        let inPortName = null;
        const sources = component.source || {};
        for (const [port, src] of Object.entries(sources)) {
            if (src[agentComponentId] && src[agentComponentId].includes(TOOL_PORT)) {
                inPortName = port;
                break;
            }
        }
        if (!inPortName) continue;

        let resolvedManifest = manifest;
        if (!resolvedManifest) {
            try {
                resolvedManifest = await fetchManifest(context, component.type);
            } catch (err) {
                await context.log({
                    step: 'component-tool-manifest-error',
                    componentId,
                    type: component.type,
                    error: err.message
                });
                continue;
            }
        }

        const def = buildComponentToolDef(componentId, component, resolvedManifest, inPortName, agentComponentId);

        await context.log({
            step: 'component-tool-manifest-inspect',
            componentId,
            manifestDescription: resolvedManifest?.description,
            manifestLabel: resolvedManifest?.label,
            manifestName: resolvedManifest?.name,
            inPortNames: (resolvedManifest?.inPorts || []).map(p => p.name),
            aiFields: def?.function?._aiFields || [],
            userStaticValues: def?.function?._userStaticValues || {}
        });
        if (def) defs.push(def);
    }

    return defs;
}

/**
 * Build tool defs for a single MCP server by listing its tools at runtime.
 * One MCP server can expose N tools — each becomes a separate tool def.
 */
async function buildMCPToolDefs(context, componentId) {
    try {
        const mcpTools = await mcp.mcpListTools(context, componentId);
        await context.log({ step: 'mcp-tool-port-list-tools', componentId, tools: mcpTools });

        return mcpTools.map((mcpTool) => {
            const safeName = mcpTool.name
                .replace(/[^a-zA-Z0-9_]/g, '_')
                .slice(0, 64 - componentId.length - 1);
            const parameters = mcpTool.inputSchema
                ? { ...mcpTool.inputSchema }
                : { type: 'object', properties: {} };
            if (parameters.type === 'object' && !parameters.properties) {
                parameters.properties = {};
            }
            return {
                type: 'function',
                function: {
                    name: `${componentId}_${safeName}`,
                    description: mcpTool.description || mcpTool.name,
                    parameters,
                    _isMCP: true,
                    _componentId: componentId,
                    _mcpToolName: mcpTool.name
                }
            };
        });
    } catch (err) {
        await context.log({ step: 'mcp-tool-port-list-tools-error', componentId, error: err.message });
        return [];
    }
}

async function collectComponentTools(context) {
    const manifests = await fetchAndCacheManifests(context);
    const defs = await buildDefsFromManifests(context, manifests);
    await context.log({ step: 'component-tools', count: defs.length });
    await context.stateSet('componentTools', defs);
    return defs;
}

async function buildComponentToolDefs(context) {
    const manifests = (await context.stateGet('componentToolManifests')) || {};
    return buildDefsFromManifests(context, manifests);
}

// ─── Tool definition builder (regular action components) ──────────────────────

function buildComponentToolDef(componentId, componentDescriptor, manifest, connectedInPortName, agentComponentId) {
    const aiFields = new Set();
    const userStaticValues = {};

    // Field configuration lives in config.transform[inPortName][agentComponentId][TOOL_PORT]
    // (not config.properties — that's empty for tool-port components).
    const transform = componentDescriptor.config?.transform?.[connectedInPortName]?.[agentComponentId]?.[TOOL_PORT];
    if (transform) {
        const modifiers = transform.modifiers || {};
        const lambda = transform.lambda || {};

        // AI fields: modifier entries whose variable references modelDefinedParameter
        for (const [key, modifier] of Object.entries(modifiers)) {
            if (!modifier || typeof modifier !== 'object') continue;
            for (const entry of Object.values(modifier)) {
                if (entry?.variable && entry.variable.includes('modelDefinedParameter')) {
                    aiFields.add(key);
                    break;
                }
            }
        }

        // Static values: lambda entries that are literal (not Handlebars) and not AI-filled
        for (const [key, val] of Object.entries(lambda)) {
            if (aiFields.has(key)) continue;
            if (val === null || val === undefined || val === '') continue;
            const str = String(val);
            if (!isHandlebarsExpression(str)) {
                userStaticValues[key] = val;
            }
        }
    }

    const inPortDef =
        (manifest.inPorts || []).find(p => p.name === connectedInPortName) ||
        (manifest.inPorts || [])[0];

    const inPortSchemaProps = inPortDef?.schema?.properties || {};
    const inPortInspector   = inPortDef?.inspector?.inputs || {};
    const inPortRequired    = new Set(inPortDef?.schema?.required || []);

    const propSchemaProps = manifest.properties?.schema?.properties || {};
    const propInspector   = manifest.properties?.inspector?.inputs || {};
    const propRequired    = new Set(manifest.properties?.schema?.required || []);

    const parameters = { type: 'object', properties: {}, required: [] };

    for (const [key, schemaProp] of Object.entries(inPortSchemaProps)) {
        if (!aiFields.has(key)) continue;
        const inp = inPortInspector[key] || {};
        parameters.properties[key] = {
            type: schemaProp.type || 'string',
            description: [inp.label, inp.tooltip].filter(Boolean).join(' — ') || key
        };
        if (inPortRequired.has(key)) parameters.required.push(key);
    }

    for (const [key, schemaProp] of Object.entries(propSchemaProps)) {
        if (!aiFields.has(key)) continue;
        if (key in parameters.properties) continue;
        const inp = propInspector[key] || {};
        parameters.properties[key] = {
            type: schemaProp.type || 'string',
            description: [inp.label, inp.tooltip].filter(Boolean).join(' — ') || key
        };
        if (propRequired.has(key)) parameters.required.push(key);
    }

    if (!parameters.required.length) delete parameters.required;

    const rawLabel = manifest.label || manifest.name || componentDescriptor.type.split('.').pop();
    const safeLabel = rawLabel.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 64 - componentId.length - 1);
    const toolName = `${componentId}_${safeLabel}`;

    return {
        type: 'function',
        function: {
            name: toolName,
            description: manifest.description || rawLabel,
            ...(Object.keys(parameters.properties).length ? { parameters } : {}),
            _componentTool: true,
            _componentId: componentId,
            _componentType: manifest.name || componentDescriptor.type,
            _inPort: inPortDef?.name || 'in',
            _userStaticValues: userStaticValues,
            _aiFields: [...aiFields]
        }
    };
}

// ─── Tool result limits ───────────────────────────────────────────────────────

function configNumber(context, name, defaultValue) {
    const value = Number(context.config?.[name]);
    return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

/**
 * The limit on all tool results of one turn, in characters, for a model with the given
 * context window (in tokens). Without a known context window, the default.
 */
function toolResultsLimit(contextWindow) {
    if (!Number.isFinite(contextWindow) || contextWindow <= 0) {
        return AI_AGENT_MAX_TOOL_RESULTS_TOTAL_CHARS;
    }
    return Math.floor(contextWindow * TOOL_RESULTS_CONTEXT_SHARE * TOOL_RESULTS_CHARS_PER_TOKEN);
}

/**
 * Creates the function that turns a tool's output into the text sent to the model, for one
 * turn of the agent. The text is compact JSON (no indentation), cut to what is left of the
 * turn's total (and to the per-result limit, if one is configured). A cut result ends with a
 * note telling the model how much is missing, so it can call the tool again with a narrower
 * request.
 */
function createToolResultFormatter(context, { contextWindow } = {}) {
    let remaining = configNumber(context, 'AI_AGENT_MAX_TOOL_RESULTS_TOTAL_CHARS', toolResultsLimit(contextWindow));
    const maxChars = configNumber(context, 'AI_AGENT_MAX_TOOL_RESULT_CHARS', remaining);

    return async (output, displayName) => {
        let text = typeof output === 'string' ? output : JSON.stringify(output);
        if (typeof text !== 'string') text = String(text);

        const limit = Math.min(maxChars, Math.max(remaining, TOOL_RESULT_MIN_CHARS));
        if (text.length > limit) {
            await context.log({
                step: 'tool-result-truncated',
                displayName,
                length: text.length,
                limit
            });
            text = `${text.slice(0, limit)}\n\n[Result truncated: showing the first ${limit} of `
                + `${text.length} characters. If you need the rest, call the tool again with a `
                + 'narrower request (filters, fewer fields, a smaller page).]';
        }
        remaining -= text.length;
        return text;
    };
}

// ─── Vercel AI SDK wrappers ───────────────────────────────────────────────────

function buildComponentVercelTools(context, componentToolsDef, tracer, getStepCtx, options = {}) {
    if (!componentToolsDef || componentToolsDef.length === 0) return {};

    const vercelTools = {};
    // One formatter per call, i.e. per turn: it tracks the turn's total of tool result text.
    const formatResult = createToolResultFormatter(context, options);

    for (const toolDef of componentToolsDef) {
        const { name, description } = toolDef.function;
        const params = toolDef.function.parameters
            ? { ...toolDef.function.parameters }
            : { type: 'object', properties: {} };

        if (params.type === 'object' && !params.properties) params.properties = {};

        vercelTools[name] = tool({
            description: description || '',
            parameters: jsonSchema(params),
            execute: async (args, options = {}) =>
                executeComponentTool(context, toolDef, args, tracer, options.toolCallId, getStepCtx, formatResult)
        });
    }

    return vercelTools;
}

async function executeComponentTool(context, toolDef, args, tracer, toolCallId, getStepCtx, formatResult) {
    formatResult = formatResult || createToolResultFormatter(context);
    const { name: fullToolName, _isMCP, _componentId, _mcpToolName,
        _componentType, _inPort, _userStaticValues } = toolDef.function;
    const displayName = _isMCP ? _mcpToolName : fullToolName.split('_').slice(1).join('_');

    const runTool = async () => {
        if (_isMCP) {
            try {
                const output = await mcp.mcpCallTool(context, _componentId, _mcpToolName, args);
                await context.log({ step: 'mcp-tool-call-result', displayName, output });
                return formatResult(output, displayName);
            } catch (err) {
                await context.log({ step: 'mcp-tool-call-error', displayName, error: err.message });
                return `Error calling tool ${displayName}: ${err.message}`;
            }
        }

        // Regular action component: merge static + AI args and call via callAppmixer.
        const endPoint = '/component/' + _componentType.replace(/\./g, '/');
        const messagePayload = { ..._userStaticValues, ...args };
        await context.log({
            step: 'component-tool-call',
            displayName,
            componentId: _componentId,
            inPort: _inPort,
            aiArgs: args,
            staticValues: _userStaticValues,
            mergedPayload: messagePayload
        });
        try {
            const result = await context.callAppmixer({
                endPoint,
                method: 'POST',
                body: {
                    componentId: _componentId,
                    messages: { [_inPort]: messagePayload },
                    log: true,
                    correlationId: context.messages?.in?.correlationId
                }
            });
            await context.log({ step: 'component-tool-result', displayName, result });
            return formatResult(result, displayName);
        } catch (err) {
            await context.log({ step: 'component-tool-call-error', displayName, endPoint, error: err.message });
            return `Error calling tool ${displayName}: ${err.message}`;
        }
    };

    if (!tracer) return runTool();

    const { SpanStatusCode } = require('@opentelemetry/api');
    const stepCtx = getStepCtx ? getStepCtx() : null;
    const startSpan = stepCtx
        ? (n, cb) => tracer.startActiveSpan(n, {}, stepCtx, cb)
        : (n, cb) => tracer.startActiveSpan(n, cb);

    return startSpan(displayName, async (span) => {
        const inputJson = JSON.stringify(args);
        span.setAttributes({
            'gen_ai.operation.name': 'execute_tool',
            'gen_ai.tool.name': displayName,
            'ai.toolCall.name': displayName,
            ...(toolCallId ? { 'ai.toolCall.id': toolCallId } : {}),
            'ai.toolCall.args': inputJson,
            'langfuse.observation.type': 'tool',
            'langfuse.observation.name': displayName,
            'input.value': inputJson,
            'input.mime_type': 'application/json',
            'langfuse.observation.input': inputJson,
            'appmixer.tool.name': displayName,
            ...(_isMCP
                ? { 'appmixer.tool.component.id': _componentId }
                : { 'appmixer.tool.component.type': _componentType }),
            ...(toolCallId ? { 'appmixer.tool.call.id': toolCallId } : {})
        });
        try {
            const output = await runTool();
            const outputString = typeof output === 'string' ? output : JSON.stringify(output);
            span.setAttributes({
                'ai.toolCall.result': outputString,
                'output.value': outputString,
                'output.mime_type': 'application/json',
                'langfuse.observation.output': outputString
            });
            return output;
        } catch (err) {
            span.recordException(err);
            span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
            throw err;
        } finally {
            span.end();
        }
    });
}

module.exports = {
    collectComponentTools,
    buildComponentToolDefs,
    buildComponentVercelTools,
    createToolResultFormatter,
    toolResultsLimit
};
