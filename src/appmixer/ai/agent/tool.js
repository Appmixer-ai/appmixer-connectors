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
 */

const { jsonSchema, tool } = require('ai');

const TOOL_PORT = 'tool';

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
 * On-demand fetches if a manifest is missing from cache.
 */
async function buildDefsFromManifests(context, manifests) {
    const flowDescriptor = context.flowDescriptor;
    const agentComponentId = context.componentId;
    const defs = [];

    for (const componentId of Object.keys(manifests)) {
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

        let manifest = manifests[componentId];
        if (!manifest) {
            try {
                manifest = await fetchManifest(context, component.type);
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

        const def = buildComponentToolDef(componentId, component, manifest, inPortName, agentComponentId);

        await context.log({
            step: 'component-tool-manifest-inspect',
            componentId,
            manifestDescription: manifest?.description,
            manifestLabel: manifest?.label,
            manifestName: manifest?.name,
            inPortNames: (manifest?.inPorts || []).map(p => p.name),
            aiFields: def?.function?._aiFields || [],
            userStaticValues: def?.function?._userStaticValues || {}
        });
        if (def) defs.push(def);
    }

    return defs;
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

// ─── Tool definition builder ──────────────────────────────────────────────────

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

// ─── Vercel AI SDK wrappers ───────────────────────────────────────────────────

function buildComponentVercelTools(context, componentToolsDef, tracer, getStepCtx) {
    if (!componentToolsDef || componentToolsDef.length === 0) return {};

    const vercelTools = {};

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
                executeComponentTool(context, toolDef, args, tracer, options.toolCallId, getStepCtx)
        });
    }

    return vercelTools;
}

async function executeComponentTool(context, toolDef, args, tracer, toolCallId, getStepCtx) {
    const { name: fullToolName, _componentId, _componentType, _inPort, _userStaticValues } = toolDef.function;
    const endPoint = '/component/' + _componentType.replace(/\./g, '/');
    const displayName = fullToolName.split('_').slice(1).join('_');

    const runTool = async () => {
        // Merge static user-configured values with AI-provided args into a single message object.
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
                    messages: { [_inPort]: messagePayload }
                }
            });
            await context.log({ step: 'component-tool-result', displayName, result });
            return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
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
    buildComponentVercelTools
};
