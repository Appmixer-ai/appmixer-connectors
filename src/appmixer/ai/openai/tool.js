'use strict';

/**
 * tool.js — "tool" output port: expose any Appmixer action component or MCP server
 * as a tool of the AI Agent.
 *
 * Based on ai/mcptools/tool.js (MCP Gateway), which is why the code below still says
 * "gateway" for the component owning the port. Two things differ and have to be kept
 * when syncing the files: embedding fields ("modelDefinedEmbedding") and the component
 * label leading the tool description. Components wired to the "tool" port are either:
 *
 *   - Regular action components: called synchronously via context.callAppmixer()
 *     (static component call, no ToolStart/ToolOutput chain, no flow-state polling).
 *   - MCP servers (appmixer.mcpservers.*.MCPServer): tools are enumerated via
 *     mcpListTools and executed via mcpCallTool (see mcp.js).
 *
 * Parameter model (regular action components)
 * ───────────────────────────────────────────
 * The user marks fields the model should fill with the "Model Defined Parameter"
 * output variable of the AI Agent (port "tool", option "modelDefinedParameter").
 * Only those fields become parameters in the tool definition. Fields with a literal
 * user-set value are passed as static properties on every call.
 *
 * A field that expects a vector (a vector database query) takes the "Model Defined
 * Embedding" variable instead: the model writes a text, the agent turns it into an
 * embedding and the component receives the vector. That makes a retrieval tool out of
 * a single query component, with no separate embeddings step in front of it.
 */

const crypto = require('crypto');
const shortuuid = require('short-uuid');
const uuid = require('uuid');
const mcp = require('./mcp');

const TOOL_PORT = 'tool';
const MAX_TOOL_NAME_LENGTH = 64;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isHandlebarsExpression(val) {
    return typeof val === 'string' && /\{\{.*?\}\}/.test(val);
}

/**
 * Tool names are `<componentId>_<name>` and must fit into 64 characters. Component
 * IDs in real flows are UUIDs (36 chars) which would leave very little room for the
 * tool name, so UUIDs are shortened (22 chars). Tool calls are resolved by looking
 * the full name up in the cached definitions, never by parsing the prefix.
 */
function encodeComponentId(componentId) {
    return uuid.validate(componentId) ? shortuuid().fromUUID(componentId) : componentId;
}

function buildToolName(componentId, rawName) {
    const prefix = encodeComponentId(componentId);
    const maxNameLength = Math.max(1, MAX_TOOL_NAME_LENGTH - prefix.length - 1);
    const safeName = rawName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, maxNameLength);
    return `${prefix}_${safeName}`;
}

/**
 * Sanitizing and truncating a name is not injective ("foo-bar" / "foo_bar", or two
 * long names sharing the retained prefix), while receive() resolves a call by the
 * full name — a colliding tool would be unreachable. Every definition of a colliding
 * group gets a suffix derived from its component and original tool name, so the
 * public name does not depend on the order the tools were listed in. Definitions that
 * still collide (an MCP server listing the same name twice) are dropped.
 *
 * @returns {{ defs: Array, dropped: Array<string> }}
 */
function disambiguateToolNames(defs) {
    const counts = new Map();
    for (const def of defs) {
        counts.set(def.function.name, (counts.get(def.function.name) || 0) + 1);
    }

    const taken = new Set();
    const unique = [];
    const dropped = [];
    for (const def of defs) {
        const fn = def.function;
        const { _componentId: componentId, _mcpToolName: mcpToolName } = fn;
        if (counts.get(fn.name) > 1) {
            const hash = crypto.createHash('sha1')
                .update(`${componentId}:${mcpToolName || ''}`)
                .digest('hex')
                .slice(0, 8);
            fn.name = `${fn.name.slice(0, MAX_TOOL_NAME_LENGTH - hash.length - 1)}_${hash}`;
        }
        if (taken.has(fn.name)) {
            dropped.push(mcpToolName || fn.name);
            continue;
        }
        taken.add(fn.name);
        unique.push(def);
    }
    return { defs: unique, dropped };
}

/**
 * Strip the internal `_*` execution metadata so that only the public
 * function-calling definition (type, function.name/description/parameters)
 * leaves the component (gateway registry, MCP clients).
 */
function toPublicToolDef(toolDef) {
    const fn = {};
    for (const [key, value] of Object.entries(toolDef.function)) {
        if (!key.startsWith('_')) fn[key] = value;
    }
    return { type: toolDef.type, function: fn };
}

// ─── Manifest fetching ────────────────────────────────────────────────────────

/**
 * Fetch the component manifest for a given fully-qualified component type.
 * Uses the /components?selector=TYPE endpoint. Returns the first (and normally
 * only) entry in the result array.
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
 * Find the input port of `component` that is wired to my "tool" output port.
 */
function findToolInPort(component, gatewayComponentId) {
    const sources = component.source || {};
    for (const [port, src] of Object.entries(sources)) {
        if (src[gatewayComponentId] && src[gatewayComponentId].includes(TOOL_PORT)) {
            return port;
        }
    }
    return null;
}

/**
 * Fetch manifests for all components wired to the gateway's "tool" port and cache
 * them to state. Called from MCPGateway.start().
 *
 * MCP servers have no static manifest — they get a sentinel { _isMCP: true } entry
 * so buildDefsFromManifests knows to enumerate their tools dynamically.
 */
async function fetchAndCacheManifests(context) {
    const flowDescriptor = context.flowDescriptor;
    const gatewayComponentId = context.componentId;
    const manifests = {};

    Object.keys(flowDescriptor).forEach((componentId) => {
        if (findToolInPort(flowDescriptor[componentId], gatewayComponentId)) {
            manifests[componentId] = null;
        }
    });

    for (const componentId of Object.keys(manifests)) {
        if (mcp.isMCPserver(context, componentId)) {
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
 */
async function buildDefsFromManifests(context, manifests) {
    const flowDescriptor = context.flowDescriptor;
    const gatewayComponentId = context.componentId;
    const defs = [];

    for (const componentId of Object.keys(manifests)) {
        const manifest = manifests[componentId];
        const { _isMCP: isMCP } = manifest || {};

        if (isMCP) {
            const mcpDefs = await buildMCPToolDefs(context, componentId);
            defs.push(...mcpDefs);
            continue;
        }

        const component = flowDescriptor[componentId];
        if (!component) continue;

        const inPortName = findToolInPort(component, gatewayComponentId);
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
        if (!resolvedManifest) continue;

        const def = buildComponentToolDef(componentId, component, resolvedManifest, inPortName, gatewayComponentId);
        const { _aiFields: aiFields, _userStaticValues: userStaticValues } = def.function;

        await context.log({
            step: 'component-tool-manifest-inspect',
            componentId,
            manifestName: resolvedManifest.name,
            manifestLabel: resolvedManifest.label,
            inPortNames: (resolvedManifest.inPorts || []).map(p => p.name),
            aiFields,
            userStaticValues
        });
        defs.push(def);
    }

    const { defs: uniqueDefs, dropped } = disambiguateToolNames(defs);
    if (dropped.length) {
        await context.log({ step: 'component-tool-duplicate-names-dropped', dropped });
    }
    return uniqueDefs;
}

/**
 * Build tool defs for a single MCP server by listing its tools.
 * One MCP server can expose N tools — each becomes a separate tool def.
 */
async function buildMCPToolDefs(context, componentId) {
    try {
        const mcpTools = await mcp.mcpListTools(context, componentId);
        await context.log({ step: 'mcp-tool-port-list-tools', componentId, tools: mcpTools });

        return (mcpTools || []).map((mcpTool) => {
            const parameters = mcpTool.inputSchema
                ? { ...mcpTool.inputSchema }
                : { type: 'object', properties: {} };
            if (parameters.type === 'object' && !parameters.properties) {
                parameters.properties = {};
            }
            return {
                type: 'function',
                function: {
                    name: buildToolName(componentId, mcpTool.name),
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

/**
 * Discover everything wired to the "tool" port, build the tool definitions and
 * cache them to state under `componentTools`. Called from MCPGateway.start().
 */
async function collectComponentTools(context) {
    const manifests = await fetchAndCacheManifests(context);
    const defs = await buildDefsFromManifests(context, manifests);
    await context.log({ step: 'component-tools', count: defs.length });
    await context.stateSet('componentTools', defs);
    return defs;
}

/**
 * Return the cached tool definitions (built in start()).
 */
async function getComponentToolDefs(context) {
    return (await context.stateGet('componentTools')) || [];
}

// ─── Tool definition builder (regular action components) ──────────────────────

function buildComponentToolDef(componentId, componentDescriptor, manifest, connectedInPortName, gatewayComponentId) {
    const aiFields = new Set();
    // AI fields the model fills with a text that is turned into an embedding vector
    // before the call (variable "modelDefinedEmbedding").
    const embeddingFields = new Set();
    const userStaticValues = {};

    // Field configuration lives in config.transform[inPortName][gatewayComponentId][TOOL_PORT]
    // (not config.properties — that's empty for tool-port components).
    const transform = componentDescriptor.config?.transform?.[connectedInPortName]?.[gatewayComponentId]?.[TOOL_PORT];
    if (transform) {
        const modifiers = transform.modifiers || {};
        const lambda = transform.lambda || {};

        // AI fields: modifier entries whose variable references modelDefinedParameter
        // or modelDefinedEmbedding.
        for (const [key, modifier] of Object.entries(modifiers)) {
            if (!modifier || typeof modifier !== 'object') continue;
            for (const entry of Object.values(modifier)) {
                if (entry?.variable && entry.variable.includes('modelDefinedEmbedding')) {
                    aiFields.add(key);
                    embeddingFields.add(key);
                    break;
                }
                if (entry?.variable && entry.variable.includes('modelDefinedParameter')) {
                    aiFields.add(key);
                    break;
                }
            }
        }

        // Static values: lambda entries that are literal (not Handlebars) and not AI-filled.
        for (const [key, val] of Object.entries(lambda)) {
            if (aiFields.has(key)) continue;
            if (val === null || val === undefined || val === '') continue;
            if (!isHandlebarsExpression(String(val))) {
                userStaticValues[key] = val;
            }
        }
    }

    const inPortDef =
        (manifest.inPorts || []).find(p => p.name === connectedInPortName) ||
        (manifest.inPorts || [])[0];

    const inPortSchemaProps = inPortDef?.schema?.properties || {};
    const inPortInspector = inPortDef?.inspector?.inputs || {};
    const inPortRequired = new Set(inPortDef?.schema?.required || []);

    const propSchemaProps = manifest.properties?.schema?.properties || {};
    const propInspector = manifest.properties?.inspector?.inputs || {};
    const propRequired = new Set(manifest.properties?.schema?.required || []);

    const parameters = { type: 'object', properties: {}, required: [] };

    // The model writes a text for an embedding field; what the component's own tooltip
    // says about the vector would only mislead it.
    const parameterFor = (key, schemaProp, inp) => (embeddingFields.has(key)
        ? { type: 'string', description: 'Text to search for. It is converted to an embedding vector before the call.' }
        : {
            type: schemaProp.type || 'string',
            description: [inp.label, inp.tooltip].filter(Boolean).join(' — ') || key
        });

    for (const [key, schemaProp] of Object.entries(inPortSchemaProps)) {
        if (!aiFields.has(key)) continue;
        parameters.properties[key] = parameterFor(key, schemaProp, inPortInspector[key] || {});
        if (inPortRequired.has(key)) parameters.required.push(key);
    }

    for (const [key, schemaProp] of Object.entries(propSchemaProps)) {
        if (!aiFields.has(key)) continue;
        if (key in parameters.properties) continue;
        parameters.properties[key] = parameterFor(key, schemaProp, propInspector[key] || {});
        if (propRequired.has(key)) parameters.required.push(key);
    }

    if (!parameters.required.length) delete parameters.required;

    // Prefer the label the user gave the component instance in the flow: several
    // instances of the same component type (e.g. two MockValue tools) must be
    // distinguishable by the model.
    const rawLabel = componentDescriptor.label || manifest.label || manifest.name
        || componentDescriptor.type.split('.').pop();

    // A manifest description says what the component does ("Query Pinecone for vectors."),
    // not what this instance is for. The label the user gave it leads the description, so
    // the model can tell e.g. which data a generic query component holds.
    const description = [componentDescriptor.label, manifest.description].filter(Boolean).join(' - ') || rawLabel;

    return {
        type: 'function',
        function: {
            name: buildToolName(componentId, rawLabel),
            description,
            ...(Object.keys(parameters.properties).length ? { parameters } : {}),
            _componentTool: true,
            _componentId: componentId,
            _componentType: manifest.name || componentDescriptor.type,
            _inPort: inPortDef?.name || 'in',
            _userStaticValues: userStaticValues,
            _aiFields: [...aiFields],
            _embeddingFields: [...embeddingFields]
        }
    };
}

// ─── Execution ────────────────────────────────────────────────────────────────

/**
 * Execute one tool call. Never throws — errors are returned as a string so that
 * the caller (webhook handler) can hand them back to the MCP client instead of
 * triggering a component retry.
 *
 * @returns {Promise<string>} tool output, always a string.
 */
async function executeComponentTool(context, toolDef, args, { correlationId, embed } = {}) {
    const { name: fullToolName, _isMCP, _componentId, _mcpToolName,
        _componentType, _inPort, _userStaticValues, _aiFields, _embeddingFields } = toolDef.function;
    const displayName = _isMCP ? _mcpToolName : fullToolName;

    if (_isMCP) {
        try {
            const output = await mcp.mcpCallTool(context, _componentId, _mcpToolName, args, correlationId);
            await context.log({ step: 'mcp-tool-call-result', displayName, output });
            return typeof output === 'string' ? output : JSON.stringify(output, null, 2);
        } catch (err) {
            await context.log({ step: 'mcp-tool-call-error', displayName, error: err.message });
            return `Error calling tool ${displayName}: ${err.message}`;
        }
    }

    // Regular action component: merge model args + static values and call it statically.
    // `args` come from the webhook caller, so only the fields the user marked as
    // "Model Defined Parameter" are taken from them, and the static values are applied
    // last — a caller can never override a value configured on the tool.
    const endPoint = '/component/' + _componentType.replace(/\./g, '/');
    const modelArgs = {};
    for (const key of _aiFields || []) {
        if (args && args[key] !== undefined) modelArgs[key] = args[key];
    }
    // Embedding fields: the model wrote a text, the component gets the vector. `embed` is
    // supplied by the component owning the port (it holds the credentials for the model).
    const embedded = {};
    for (const key of _embeddingFields || []) {
        if (typeof modelArgs[key] !== 'string') continue;
        try {
            if (!embed) throw new Error('no embedding model is available');
            const vector = await embed(modelArgs[key]);
            embedded[key] = `[embedding of ${vector.length} values]`;
            modelArgs[key] = vector;
        } catch (err) {
            await context.log({ step: 'component-tool-embedding-error', displayName, field: key, error: err.message });
            return `Error calling tool ${displayName}: could not create the embedding for "${key}": ${err.message}`;
        }
    }
    const messagePayload = { ...modelArgs, ..._userStaticValues };
    await context.log({
        step: 'component-tool-call',
        displayName,
        componentId: _componentId,
        inPort: _inPort,
        aiArgs: args,
        staticValues: _userStaticValues,
        // The vectors themselves would only flood the log.
        mergedPayload: { ...messagePayload, ...embedded }
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
}

module.exports = {
    TOOL_PORT,
    collectComponentTools,
    getComponentToolDefs,
    executeComponentTool,
    toPublicToolDef
};
