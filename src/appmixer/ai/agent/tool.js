'use strict';

/**
 * tool.js — "tool" output port: use any Appmixer action component as an AI agent tool.
 *
 * This is intentionally separate from tools.js (which handles ToolStart chains + MCP servers
 * wired to the "tools" port). Components wired to the "tool" port are called synchronously
 * via context.callAppmixer() rather than through the pub/sub poll mechanism.
 *
 * Parameter model
 * ───────────────
 * The user marks fields they want the AI to fill with the "Model Defined Parameter" output
 * variable from the AI Agent (port "tool", option "modelDefinedParameter").  Only those
 * fields become parameters in the tool definition sent to the LLM.  Fields with a literal
 * user-set value are passed as static `properties` on every callAppmixer invocation.
 *
 * This means connected tool components can have required fields without blocking flow
 * startup: the user satisfies the validator by setting required fields to the
 * "Model Defined Parameter" variable, and the AI fills them at call time.
 */

const { jsonSchema, tool } = require('ai');

const TOOL_PORT = 'tool';
/** Variable value exposed on the agent's "tool" outPort options. */
const MODEL_DEFINED_PARAM_KEY = 'modelDefinedParameter';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when the value is any Handlebars/template expression (flow-mapping).
 */
function isHandlebarsExpression(val) {
    return typeof val === 'string' && /\{\{.*?\}\}/.test(val);
}

/**
 * Returns true when the field value is a reference to the AI Agent's
 * "Model Defined Parameter" variable — meaning the AI should fill this field.
 *
 * Appmixer stores variable references as expressions like:
 *   {{{agentComponentId.tool.modelDefinedParameter}}}
 * We match on both the agent's componentId and the variable key so we don't
 * accidentally treat references to other components' variables as AI-fillable.
 */
function isModelDefinedParameter(val, agentComponentId) {
    return typeof val === 'string' &&
        val.includes(agentComponentId) &&
        val.includes(MODEL_DEFINED_PARAM_KEY);
}

// ─── Discovery ────────────────────────────────────────────────────────────────

/**
 * Fetch manifests for all components wired to the agent's "tool" port and cache
 * them to state keyed by componentId.  Called from AIAgent.start() so the HTTP
 * round-trips happen once at flow startup rather than on every receive().
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
                manifests[componentId] = null; // placeholder
            }
        });
    });

    for (const componentId of Object.keys(manifests)) {
        const otherType = flowDescriptor[componentId].type;
        try {
            const raw = await context.callAppmixer({
                endPoint: `/components/${encodeURIComponent(otherType)}?manifest=yes`,
                method: 'GET'
            });
            manifests[componentId] = typeof raw === 'string' ? JSON.parse(raw) : raw;
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
 * Build tool definitions from the current flowDescriptor + (optionally) pre-fetched
 * manifests.  If a manifest is missing from the cache it is fetched on-demand.
 *
 * This is called both from collectComponentTools (start) and
 * buildComponentToolDefs (receive) so parameter detection always reflects the
 * live flowDescriptor — i.e. which fields currently carry the
 * "Model Defined Parameter" variable.
 */
async function buildDefsFromManifests(context, manifests) {
    const flowDescriptor = context.flowDescriptor;
    const agentComponentId = context.componentId;
    const defs = [];

    for (const componentId of Object.keys(manifests)) {
        const component = flowDescriptor[componentId];
        if (!component) continue;

        // Determine which inPort is wired to the agent's "tool" port
        let inPortName = null;
        const sources = component.source || {};
        for (const [port, src] of Object.entries(sources)) {
            if (src[agentComponentId] && src[agentComponentId].includes(TOOL_PORT)) {
                inPortName = port;
                break;
            }
        }
        if (!inPortName) continue;

        let manifest = manifests[componentId];
        if (!manifest) {
            // On-demand fetch if the manifest wasn't cached (e.g. newly connected component)
            try {
                const raw = await context.callAppmixer({
                    endPoint: `/components/${encodeURIComponent(component.type)}?manifest=yes`,
                    method: 'GET'
                });
                manifest = typeof raw === 'string' ? JSON.parse(raw) : raw;
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

        await context.log({
            step: 'component-tool-manifest-inspect',
            componentId,
            manifestDescription: manifest?.description,
            manifestLabel: manifest?.label,
            manifestName: manifest?.name,
            inPortNames: (manifest?.inPorts || []).map(p => p.name),
            configProperties: component.config?.properties || {}
        });
        const def = buildComponentToolDef(componentId, component, manifest, inPortName, agentComponentId);
        if (def) defs.push(def);
    }

    return defs;
}

/**
 * Full discovery: fetch manifests, cache them, build and cache tool definitions.
 * Called from AIAgent.start().
 */
async function collectComponentTools(context) {
    const manifests = await fetchAndCacheManifests(context);
    const defs = await buildDefsFromManifests(context, manifests);
    await context.log({ step: 'component-tools', count: defs.length });
    await context.stateSet('componentTools', defs);
    return defs;
}

/**
 * Runtime refresh: rebuild tool definitions from cached manifests + current
 * flowDescriptor.  No HTTP calls unless a component has no cached manifest.
 * Called from AIAgent.receive() so "Model Defined Parameter" markings are
 * evaluated against the live flow configuration on every agent turn.
 */
async function buildComponentToolDefs(context) {
    const manifests = (await context.stateGet('componentToolManifests')) || {};
    const defs = await buildDefsFromManifests(context, manifests);
    return defs;
}

/**
 * Build a single OpenAI-format tool definition from a fetched component manifest.
 *
 * Parameter rules:
 *   - A field is an AI parameter ONLY if the user has set it to the agent's
 *     "Model Defined Parameter" variable (detectable via agentComponentId +
 *     MODEL_DEFINED_PARAM_KEY in the stored value).
 *   - Fields with a literal user-set value are collected as _userStaticValues
 *     and passed verbatim as `properties` on every callAppmixer call.
 *   - Fields with neither (not set, or set to some other expression) are ignored.
 *
 * @param {string} componentId
 * @param {object} componentDescriptor  - Flow descriptor entry for this component
 * @param {object} manifest             - Fetched component.json manifest
 * @param {string} connectedInPortName  - Name of the inPort wired to the agent's "tool" port
 * @param {string} agentComponentId     - componentId of the AI Agent itself
 * @returns {object|null} OpenAI-format tool definition, or null on invalid input
 */
function buildComponentToolDef(componentId, componentDescriptor, manifest, connectedInPortName, agentComponentId) {
    const userConfig = componentDescriptor.config?.properties || {};

    // Classify each configured field:
    //   aiFields        → value is the "Model Defined Parameter" variable → AI fills at runtime
    //   userStaticValues→ literal value set by user → passed as static properties
    const aiFields = new Set();
    const userStaticValues = {};

    for (const [key, val] of Object.entries(userConfig)) {
        if (val === null || val === undefined || val === '') continue;
        const str = String(val);
        if (isModelDefinedParameter(str, agentComponentId)) {
            aiFields.add(key);
        } else if (!isHandlebarsExpression(str)) {
            userStaticValues[key] = val;
        }
        // Any other Handlebars expression (reference to a different component's output)
        // is silently ignored — it won't resolve in a direct callAppmixer call.
    }

    // Locate the manifest inPort definition for the connected port
    const inPortDef =
        (manifest.inPorts || []).find(p => p.name === connectedInPortName) ||
        (manifest.inPorts || [])[0];

    const inPortSchemaProps = inPortDef?.schema?.properties || {};
    const inPortInspector = inPortDef?.inspector?.inputs || {};
    const inPortRequired = new Set(inPortDef?.schema?.required || []);

    // Properties schema + inspector
    const propSchemaProps = manifest.properties?.schema?.properties || {};
    const propInspector = manifest.properties?.inspector?.inputs || {};
    const propRequired = new Set(manifest.properties?.schema?.required || []);

    const parameters = { type: 'object', properties: {}, required: [] };

    // inPort fields marked for AI
    for (const [key, schemaProp] of Object.entries(inPortSchemaProps)) {
        if (!aiFields.has(key)) continue;
        const inp = inPortInspector[key] || {};
        const desc = [inp.label, inp.tooltip].filter(Boolean).join(' — ') || key;
        parameters.properties[key] = { type: schemaProp.type || 'string', description: desc };
        if (inPortRequired.has(key)) parameters.required.push(key);
    }

    // Properties fields marked for AI (skip duplicates already added from inPort)
    for (const [key, schemaProp] of Object.entries(propSchemaProps)) {
        if (!aiFields.has(key)) continue;
        if (key in parameters.properties) continue;
        const inp = propInspector[key] || {};
        const desc = [inp.label, inp.tooltip].filter(Boolean).join(' — ') || key;
        parameters.properties[key] = { type: schemaProp.type || 'string', description: desc };
        if (propRequired.has(key)) parameters.required.push(key);
    }

    if (!parameters.required.length) delete parameters.required;

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
            // ── Execution metadata (not sent to the model) ──────────────────
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
 *
 * AI-filled args go into messages.[inPort][0]; user static values go into properties.
 * Returns the outPort → result map as a JSON string.
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
    buildComponentToolDefs,
    buildComponentToolDef,
    buildComponentVercelTools,
    executeComponentTool
};
