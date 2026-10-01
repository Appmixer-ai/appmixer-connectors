'use strict';

/**
 * toolChain.js — a tool made of several components.
 *
 * The component wired to the "tool" port is the first step of a tool. Every component
 * connected behind it is another step: Generate Embeddings -> Query Vectors is one
 * retrieval tool. There is no ToolStart in front and no ToolOutput at the end; the
 * output of the last step is what the model gets back.
 *
 * The steps are not run by the flow engine. Like the first component (see tool.js),
 * each one is called statically, and its input is built here from the mapping the
 * user made in the flow:
 *
 *   - a literal value is passed as it is,
 *   - a variable of an earlier step, or of anything in front of the agent, is resolved
 *     from that component's output,
 *   - a field filled with "Model Defined Parameter" becomes a parameter of the tool.
 *
 * Limits: the chain is a straight line (it ends where the flow branches), and a
 * variable with modifiers fails the call with a message saying so.
 */

const MODEL_PARAMETER = 'modelDefinedParameter';
const TOOL_OUTPUT_TYPE = 'appmixer.ai.agenttools.ToolOutput';
const VARIABLE = /\{\{\{([^{}]+)\}\}\}/g;
const SINGLE_VARIABLE = /^\{\{\{([^{}]+)\}\}\}$/;
// Arrays longer than this (embedding vectors) are summarized in the logs.
const MAX_LOGGED_ARRAY = 20;

// ─── Discovery ────────────────────────────────────────────────────────────────

/**
 * Components fed from `componentId`, with the ports the connection uses.
 */
function findSuccessors(flowDescriptor, componentId) {
    const successors = [];
    for (const [id, component] of Object.entries(flowDescriptor)) {
        for (const [inPort, sources] of Object.entries(component.source || {})) {
            const ports = sources[componentId];
            if (ports && ports.length) {
                successors.push({ id, inPort, sourcePort: ports[0] });
            }
        }
    }
    return successors;
}

/**
 * How each input of a step gets its value.
 */
function readFields(transform) {
    const lambda = transform?.lambda || {};
    const modifiers = transform?.modifiers || {};
    const fields = {};

    for (const [key, value] of Object.entries(lambda)) {
        const variables = modifiers[key] && typeof modifiers[key] === 'object' ? modifiers[key] : {};
        const isModelDefined = Object.values(variables)
            .some((entry) => entry?.variable && entry.variable.includes(MODEL_PARAMETER));

        if (isModelDefined) {
            fields[key] = { kind: 'model' };
        } else if (typeof value === 'string' && new RegExp(VARIABLE.source).test(value)) {
            fields[key] = { kind: 'variable', value, variables };
        } else if (value !== null && value !== undefined && value !== '') {
            fields[key] = { kind: 'static', value };
        }
    }
    return fields;
}

/**
 * Add the components connected behind the tool's first component to its definition:
 * the steps to run (`_chain`), their model defined fields as tool parameters and
 * their descriptions.
 *
 * @param {object} context
 * @param {object} toolDef - definition built for the component on the "tool" port
 * @param {function} fetchManifest - (context, componentType) => manifest
 */
async function extendToolDef(context, toolDef, fetchManifest) {
    const flowDescriptor = context.flowDescriptor;
    const fn = toolDef.function;
    const { _componentId: firstComponentId } = fn;
    const visited = new Set([context.componentId, firstComponentId]);
    const steps = [];
    const descriptions = [];
    let previousId = firstComponentId;

    for (;;) {
        const successors = findSuccessors(flowDescriptor, previousId)
            .filter((next) => !visited.has(next.id) && flowDescriptor[next.id].type !== TOOL_OUTPUT_TYPE);
        if (!successors.length) break;
        if (successors.length > 1) {
            await context.log({
                step: 'component-tool-chain-branch',
                tool: fn.name,
                componentId: previousId,
                message: 'A tool chain has to be a straight line. It ends here; the branches are not run.',
                branches: successors.map((next) => next.id)
            });
            break;
        }

        const [next] = successors;
        const component = flowDescriptor[next.id];
        let manifest = {};
        try {
            manifest = await fetchManifest(context, component.type) || {};
        } catch (err) {
            // Only the parameter descriptions come from the manifest; the step still runs.
            await context.log({ step: 'component-tool-manifest-error', componentId: next.id, type: component.type, error: err.message });
        }

        const inPortDef = (manifest.inPorts || []).find((port) => port.name === next.inPort) || {};
        const fields = readFields(component.config?.transform?.[next.inPort]?.[previousId]?.[next.sourcePort]);

        for (const [key, field] of Object.entries(fields)) {
            if (field.kind !== 'model') continue;
            fn.parameters = fn.parameters || { type: 'object', properties: {} };
            // Two steps can have a field of the same name; the later one gets a suffix.
            field.parameter = key in fn.parameters.properties ? `${key}_${steps.length + 2}` : key;
            const input = inPortDef.inspector?.inputs?.[key] || {};
            fn.parameters.properties[field.parameter] = {
                type: inPortDef.schema?.properties?.[key]?.type || 'string',
                description: [input.label, input.tooltip].filter(Boolean).join(' — ') || key
            };
            if ((inPortDef.schema?.required || []).includes(key)) {
                fn.parameters.required = [...(fn.parameters.required || []), field.parameter];
            }
        }

        steps.push({
            componentId: next.id,
            componentType: manifest.name || component.type,
            label: component.label || manifest.label || component.type.split('.').pop(),
            inPort: next.inPort,
            sourceId: previousId,
            sourcePort: next.sourcePort,
            fields
        });
        if (manifest.description) descriptions.push(manifest.description);
        visited.add(next.id);
        previousId = next.id;
    }

    if (steps.length) {
        Object.assign(fn, {
            _chain: steps,
            description: [fn.description, ...descriptions].join(' Then: ')
        });
    }
    return toolDef;
}

// ─── Execution ────────────────────────────────────────────────────────────────

/**
 * Value of a flow variable such as `$.<componentId>.out.result.matches[0].id`.
 */
function getVariable(outputs, variable) {
    const path = String(variable).replace(/^\$\./, '').replace(/\[(\d+)\]/g, '.$1').split('.');
    let value = outputs;
    for (const key of path) {
        if (value === null || value === undefined) return undefined;
        value = value[key];
    }
    return value;
}

function resolveField(field, outputs) {
    const lookup = (key) => {
        const entry = field.variables[key];
        if (!entry?.variable) return undefined;
        if (entry.functions?.length) {
            const names = entry.functions.map((fn) => fn.name).join(', ');
            throw new Error(`variable modifiers are not supported in a tool chain (${names})`);
        }
        return getVariable(outputs, entry.variable);
    };

    // A value that is one variable and nothing else keeps its type (a vector stays an array).
    const single = SINGLE_VARIABLE.exec(field.value);
    if (single) return lookup(single[1]);

    return field.value.replace(VARIABLE, (match, key) => {
        const value = lookup(key);
        if (value === null || value === undefined) return '';
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    });
}

function buildPayload(step, args, outputs) {
    const payload = {};
    for (const [key, field] of Object.entries(step.fields)) {
        let value;
        if (field.kind === 'static') value = field.value;
        if (field.kind === 'model') value = args?.[field.parameter];
        if (field.kind === 'variable') value = resolveField(field, outputs);
        if (value !== undefined) payload[key] = value;
    }
    return payload;
}

function forLog(value) {
    return JSON.parse(JSON.stringify(value === undefined ? null : value, (key, item) => (
        Array.isArray(item) && item.length > MAX_LOGGED_ARRAY ? `[array of ${item.length} items]` : item
    )));
}

/**
 * Run the steps behind the tool's first component. Never throws: like in tool.js, an
 * error is returned as the tool output so that the model can deal with it.
 *
 * @param {object} context
 * @param {object} toolDef
 * @param {object} args - arguments the model called the tool with
 * @param {*} firstResult - output of the first component
 * @returns {Promise<string>} output of the last step that ran
 */
async function run(context, toolDef, args, firstResult) {
    const fn = toolDef.function;
    const { _componentId: firstComponentId, _chain: chain } = fn;
    // Outputs of the components in front of the agent are in the scope of its message,
    // so a step can use them just like it can in the flow.
    const outputs = { ...(context.messages?.in?.scope || {}), [firstComponentId]: firstResult };
    let result = firstResult;

    for (const step of chain) {
        // As in a running flow, a step runs only when its source port sent something.
        const source = outputs[step.sourceId];
        if (!source || typeof source !== 'object' || source[step.sourcePort] === undefined) {
            await context.log({ step: 'component-tool-chain-stopped', tool: fn.name, before: step.label, sourcePort: step.sourcePort });
            break;
        }

        try {
            const payload = buildPayload(step, args, outputs);
            await context.log({
                step: 'component-tool-chain-call',
                tool: fn.name,
                label: step.label,
                componentId: step.componentId,
                payload: forLog(payload)
            });
            result = await context.callAppmixer({
                endPoint: '/component/' + step.componentType.replace(/\./g, '/'),
                method: 'POST',
                body: {
                    componentId: step.componentId,
                    messages: { [step.inPort]: payload }
                }
            });
            outputs[step.componentId] = result;
            await context.log({ step: 'component-tool-chain-result', tool: fn.name, label: step.label, result: forLog(result) });
        } catch (err) {
            await context.log({ step: 'component-tool-chain-error', tool: fn.name, label: step.label, error: err.message });
            return `Error calling tool ${fn.name} (step "${step.label}"): ${err.message}`;
        }
    }

    return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
}

module.exports = {
    extendToolDef,
    run
};
