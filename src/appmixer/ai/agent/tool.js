'use strict';

/**
 * tool.js — "tool" output port: use any Appmixer action component as an AI agent tool.
 *
 * This is intentionally separate from tools.js (which handles ToolStart chains + MCP servers
 * wired to the "tools" port). Components wired to the "tool" port are called synchronously
 * via context.callAppmixer() rather than through the pub/sub poll mechanism.
 */

const { jsonSchema, tool } = require('ai');

const TOOL_PORT = 'tool';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when the value is a Handlebars/template expression set by
 * flow-mapping rather than a literal user-typed value.
 */
function isHandlebarsExpression(val) {
    return typeof val === 'string' && /\{\{.*?\}\}/.test(val);
}

// ─── Discovery ────────────────────────────────────────────────────────────────

/**
 * Collect all components wired to the agent's "tool" output port, fetch their
 * component.json manifests, build tool definitions, and persist them to state.
 *
 * Called from AIAgent.start() so definitions are ready before the first receive().
 */
async function collectComponentTools(context) {
    const defs = await getComponentToolsDefinition(context);
    await context.log({ step: 'component-tools', count: defs.length });
    await context.stateSet('componentTools', defs);
    return defs;
}

/**
 * Discover components wired to the "tool" port and build their tool definitions.
 * Fetches the manifest for each component so we can derive parameter descriptions.
 */
async function getComponentToolsDefinition(context) {
    const flowDescriptor = context.flowDescriptor;
    const agentComponentId = context.componentId;
    const connectedComponents = {};

    // Walk the flow graph: find components whose source references the agent's "tool" outPort
    Object.keys(flowDescriptor).forEach((componentId) => {
        const component = flowDescriptor[componentId];
        const sources = component.source || {};
        Object.keys(sources).forEach((inPort) => {
            const source = sources[inPort];
            if (source[agentComponentId] && source[agentComponentId].includes(TOOL_PORT)) {
                connectedComponents[componentId] = { component, inPortName: inPort };
            }
        });
    });

    const defs = [];

    for (const [componentId, { component, inPortName }] of Object.entries(connectedComponents)) {
        const otherType = component.type;
        let manifest;
        try {
            const { data } = await context.httpRequest.get(
                `${context.config.apiUrl}/components/${encodeURIComponent(otherType)}?manifest=yes`,
                { headers: { Authorization: `Bearer ${context.config.token}` } }
            );
            manifest = data;
        } catch (err) {
            await context.log({
                step: 'component-tool-manifest-error',
                componentId,
                type: otherType,
                error: err.message
            });
            continue;
        }

        const def = buildComponentToolDef(componentId, component, manifest, inPortName);
        if (def) defs.push(def);
    }

    return defs;
}

/**
 * Build a single OpenAI-format tool definition from a fetched component manifest.
 *
 * Rules for parameters:
 *   - Start from all inPort schema fields + properties schema fields.
 *   - Any field with a literal (non-expression) value already set by the user in
 *     the component's config is EXCLUDED from AI-fillable parameters — the user
 *     deliberately pre-configured it (e.g. a specific Google Calendar ID).
 *   - Descriptions are taken from inspector labels + tooltips.
 *
 * Extra metadata fields (_componentTool, _componentType, _inPort, _userStaticValues)
 * are stored alongside the standard function object so the executor can retrieve
 * them at call time without extra state lookups.
 *
 * @param {string} componentId
 * @param {object} componentDescriptor - Flow descriptor entry for this component
 * @param {object} manifest            - Fetched component.json manifest
 * @param {string} connectedInPortName - Name of the inPort wired to the agent's "tool" port
 * @returns {object|null} OpenAI-format tool definition, or null on invalid input
 */
function buildComponentToolDef(componentId, componentDescriptor, manifest, connectedInPortName) {
    const userConfig = componentDescriptor.config?.properties || {};

    // Collect literal user-preset values (skip Handlebars expressions / empty values)
    const userStaticValues = {};
    for (const [key, val] of Object.entries(userConfig)) {
        if (
            val !== null &&
            val !== undefined &&
            val !== '' &&
            !isHandlebarsExpression(String(val))
        ) {
            userStaticValues[key] = val;
        }
    }

    // Locate the manifest inPort definition that matches the connected port
    const inPortDef =
        (manifest.inPorts || []).find(p => p.name === connectedInPortName) ||
        (manifest.inPorts || [])[0];

    const inPortSchemaProps = inPortDef?.schema?.properties || {};
    const inPortInspector = inPortDef?.inspector?.inputs || {};

    // Properties (static config) schema + inspector
    const propSchemaProps = manifest.properties?.schema?.properties || {};
    const propInspector = manifest.properties?.inspector?.inputs || {};

    const parameters = { type: 'object', properties: {} };

    // inPort fields → AI parameters (skip user-preset ones)
    for (const [key, schemaProp] of Object.entries(inPortSchemaProps)) {
        if (key in userStaticValues) continue;
        const inp = inPortInspector[key] || {};
        const desc = [inp.label, inp.tooltip].filter(Boolean).join(' — ') || key;
        parameters.properties[key] = {
            type: schemaProp.type || 'string',
            description: desc
        };
    }

    // Properties fields → AI parameters (skip user-preset ones; skip inPort duplicates)
    for (const [key, schemaProp] of Object.entries(propSchemaProps)) {
        if (key in userStaticValues) continue;
        if (key in parameters.properties) continue;
        const inp = propInspector[key] || {};
        const desc = [inp.label, inp.tooltip].filter(Boolean).join(' — ') || key;
        parameters.properties[key] = {
            type: schemaProp.type || 'string',
            description: desc
        };
    }

    // Sanitize tool name: <componentId>_<Label>, max 64 chars total
    const rawLabel = manifest.label || manifest.name || componentDescriptor.type.split('.').pop();
    const safeLabel = rawLabel
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .slice(0, 64 - componentId.length - 1);
    const toolName = `${componentId}_${safeLabel}`;

    return {
        type: 'function',
        function: {
            name: toolName,
            description: manifest.description || rawLabel,
            ...(Object.keys(parameters.properties).length ? { parameters } : {}),
            // ── Execution metadata (not sent to the model) ─────────────────
            _componentTool: true,
            _componentType: manifest.name || componentDescriptor.type,
            _inPort: inPortDef?.name || 'in',
            _userStaticValues: userStaticValues
        }
    };
}

// ─── Vercel AI SDK wrappers ───────────────────────────────────────────────────

/**
 * Convert component tool definitions into Vercel AI SDK tool objects.
 * Returns a plain object keyed by tool name, ready to spread into the
 * final tools map passed to generateText / streamText.
 *
 * @param {object}   context
 * @param {Array}    componentToolsDef  - Definitions returned by getComponentToolsDefinition()
 * @param {object}   [tracer]           - OTEL tracer for Langfuse spans (optional)
 * @param {Function} [getStepCtx]       - Returns current model_step OTEL context (optional)
 * @returns {object} Map of toolName → Vercel AI SDK tool
 */
function buildComponentVercelTools(context, componentToolsDef, tracer, getStepCtx) {
    if (!componentToolsDef || componentToolsDef.length === 0) return {};

    const vercelTools = {};

    for (const toolDef of componentToolsDef) {
        const { name, description } = toolDef.function;
        const params = toolDef.function.parameters
            ? { ...toolDef.function.parameters }
            : { type: 'object', properties: {} };

        if (params.type === 'object' && !params.properties) {
            params.properties = {};
        }

        vercelTools[name] = tool({
            description: description || '',
            parameters: jsonSchema(params),
            execute: async (args, options = {}) =>
                executeComponentTool(context, toolDef, args, tracer, options.toolCallId, getStepCtx)
        });
    }

    return vercelTools;
}

/**
 * Execute a component tool by calling it directly via the Appmixer REST API.
 * The call is synchronous from the agent's perspective — no pub/sub polling needed.
 *
 * The body sent to callAppmixer follows the Appmixer component invocation contract:
 *   messages: { [inPort]: [argsFilledByAI] }
 *   properties: { ...userStaticValues }
 *
 * The response is a map of outPort → result values.
 *
 * @returns {string} JSON-stringified result map, or an error message string.
 */
async function executeComponentTool(context, toolDef, args, tracer, toolCallId, getStepCtx) {
    const { name: fullToolName, _componentType, _inPort, _userStaticValues } = toolDef.function;

    // appmixer.google.calendar.CreateEvent → /component/appmixer/google/calendar/CreateEvent
    const endPoint = '/component/' + _componentType.replace(/\./g, '/');

    // Display name for logging / tracing (strip the componentId prefix)
    const displayName = fullToolName.split('_').slice(1).join('_');

    const runTool = async () => {
        try {
            const result = await context.callAppmixer({
                endPoint,
                method: 'POST',
                body: {
                    messages: { [_inPort]: [args] },
                    properties: _userStaticValues
                }
            });
            return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        } catch (err) {
            await context.log({
                step: 'component-tool-call-error',
                displayName,
                endPoint,
                error: err.message
            });
            return `Error calling tool ${displayName}: ${err.message}`;
        }
    };

    // Without a tracer, just run and return.
    if (!tracer) return runTool();

    // With a tracer, wrap in a Langfuse tool span for observability.
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
            'appmixer.tool.component.type': _componentType,
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
    getComponentToolsDefinition,
    buildComponentToolDef,
    buildComponentVercelTools,
    executeComponentTool
};
