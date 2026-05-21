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

const zlib = require('zlib');
const { jsonSchema, tool } = require('ai');

const TOOL_PORT = 'tool';
const MODEL_DEFINED_PARAM_KEY = 'modelDefinedParameter';

// ─── ZIP extraction ───────────────────────────────────────────────────────────

/**
 * Extract and parse the component.json for a given component type from the ZIP
 * blob returned by GET /components/{type}.
 *
 * The ZIP contains entries like:
 *   appmixer/slack/list/SendChannelMessage/component.json
 *
 * We scan all local-file-header entries, decompress each component.json we find,
 * and return the one whose "name" field matches componentType.
 */
function extractComponentJson(raw, componentType) {
    // callAppmixer may return a Buffer or a binary string — normalise to Buffer.
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'binary');

    const LOCAL_FILE_SIG = 0x04034b50; // PK\x03\x04
    let offset = 0;
    const candidates = [];

    while (offset + 30 <= buf.length) {
        if (buf.readUInt32LE(offset) !== LOCAL_FILE_SIG) {
            offset++;
            continue;
        }

        const compression  = buf.readUInt16LE(offset + 8);
        const compressedSz = buf.readUInt32LE(offset + 18);
        const filenameSz   = buf.readUInt16LE(offset + 26);
        const extraSz      = buf.readUInt16LE(offset + 28);
        const dataStart    = offset + 30 + filenameSz + extraSz;
        const dataEnd      = dataStart + compressedSz;

        if (dataEnd > buf.length) break;

        const filename = buf.slice(offset + 30, offset + 30 + filenameSz).toString('utf8');

        if (filename.endsWith('component.json')) {
            const compressed = buf.slice(dataStart, dataEnd);
            try {
                const jsonStr = compression === 0
                    ? compressed.toString('utf8')                        // stored
                    : zlib.inflateRawSync(compressed).toString('utf8'); // deflated
                const parsed = JSON.parse(jsonStr);
                candidates.push(parsed);
            } catch (_) { /* skip unreadable entry */ }
        }

        offset = dataEnd;
    }

    if (candidates.length === 0) return null;
    // Prefer the entry whose "name" matches the requested type exactly.
    return candidates.find(c => c.name === componentType) || candidates[0];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isHandlebarsExpression(val) {
    return typeof val === 'string' && /\{\{.*?\}\}/.test(val);
}

function isModelDefinedParameter(val, agentComponentId) {
    return typeof val === 'string' &&
        val.includes(agentComponentId) &&
        val.includes(MODEL_DEFINED_PARAM_KEY);
}

// ─── Manifest fetching ────────────────────────────────────────────────────────

async function fetchManifest(context, componentType) {
    const raw = await context.callAppmixer({
        endPoint: `/components/${encodeURIComponent(componentType)}`,
        method: 'GET'
    });
    return extractComponentJson(raw, componentType);
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
    const userConfig = componentDescriptor.config?.properties || {};

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
            _componentType: manifest.name || componentDescriptor.type,
            _inPort: inPortDef?.name || 'in',
            _userStaticValues: userStaticValues
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
    const { name: fullToolName, _componentType, _inPort, _userStaticValues } = toolDef.function;
    const endPoint = '/component/' + _componentType.replace(/\./g, '/');
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
    buildComponentToolDef,
    buildComponentVercelTools,
    executeComponentTool
};
