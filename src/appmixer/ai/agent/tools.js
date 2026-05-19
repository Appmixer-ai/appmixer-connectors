'use strict';

const shortuuid = require('short-uuid');
const uuid = require('uuid');
const { jsonSchema, tool } = require('ai');
const lib = require('./lib');

const TOOLS_OUTPUT_POLL_TIMEOUT = 2 * 60 * 1000;
const TOOLS_OUTPUT_POLL_INTERVAL = 300;

// ─── Tool discovery ───────────────────────────────────────────────────────────

/**
 * Collect all tool definitions (Appmixer ToolStart chains + MCP servers)
 * and persist them to component state so they survive message boundaries.
 */
async function collectTools(context) {

    const tools = await getAllToolsDefinition(context);
    await context.log({ step: 'tools', tools });
    await context.stateSet('tools', tools);
    return tools;
}

/**
 * Build the combined list of OpenAI-format tool definitions from both
 * Appmixer ToolStart chains and MCP server components wired to the agent.
 */
async function getAllToolsDefinition(context) {

    const flowDescriptor = context.flowDescriptor;
    const agentComponentId = context.componentId;
    const toolsPort = 'tools';

    const appmixerTools = {};
    let error;

    Object.keys(flowDescriptor).forEach((componentId) => {
        const component = flowDescriptor[componentId];
        const sources = component.source;
        Object.keys(sources || {}).forEach((inPort) => {
            const source = sources[inPort];
            if (source[agentComponentId] && source[agentComponentId].includes(toolsPort)) {
                appmixerTools[componentId] = component;
                if (component.type !== 'appmixer.ai.agenttools.ToolStart') {
                    error = `Component ${componentId} is not of type 'ToolStart' but ${component.type}.
                        Every tool chain connected to the '${toolsPort}' port of the AI Agent
                        must start with 'ToolStart' and end with 'ToolOutput'.
                        This is where you describe what the tool does and what parameters should the AI model provide to it.`;
                }
            }
        });
    });

    if (error) {
        throw new context.CancelError(error);
    }

    const toolsDefinition = getToolsDefinition(appmixerTools);
    const mcpToolsDefinition = await getMCPToolsDefinition(context);
    return toolsDefinition.concat(mcpToolsDefinition);
}

/**
 * Convert Appmixer ToolStart component descriptors into OpenAI-format tool definitions.
 */
function getToolsDefinition(tools) {

    const toolsDefinition = [];

    Object.keys(tools).forEach((componentId) => {
        const component = tools[componentId];
        const parameters = component.config.properties.parameters?.ADD || [];
        const toolParameters = {
            type: 'object',
            properties: {}
        };
        parameters.forEach((parameter) => {
            if (Object.keys(parameter).length === 0) return;
            toolParameters.properties[parameter.name] = {
                type: parameter.type,
                description: parameter.description
            };
        });
        let toolName = (component.label || component.type.split('.').pop());
        toolName = toolName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 64 - componentId.length - 1);
        const toolDefinition = {
            type: 'function',
            function: {
                name: componentId + '_' + toolName,
                description: component.config.properties.description
            }
        };
        if (parameters.length) {
            toolDefinition.function.parameters = toolParameters;
        }
        toolsDefinition.push(toolDefinition);
    });

    return toolsDefinition;
}

/**
 * Collect tool definitions from all MCP server components wired to the agent's mcp port.
 */
async function getMCPToolsDefinition(context) {

    const toolsDefinition = [];
    const flowDescriptor = context.flowDescriptor;
    const agentComponentId = context.componentId;
    const mcpPort = 'mcp';
    const components = {};
    let error;

    Object.keys(flowDescriptor).forEach((componentId) => {
        const component = flowDescriptor[componentId];
        const sources = component.source;
        Object.keys(sources || {}).forEach((inPort) => {
            const source = sources[inPort];
            if (source[agentComponentId] && source[agentComponentId].includes(mcpPort)) {
                components[componentId] = component;
                if (component.type.split('.').slice(0, 2).join('.') !== 'appmixer.mcpservers') {
                    error = `Component ${componentId} is not an 'MCP Server' but ${component.type}.
                        Every mcp component connected to the '${mcpPort}' port of the AI Agent
                        must be an MCP server.`;
                }
            }
        });
    });

    if (error) {
        throw new context.CancelError(error);
    }

    for (const componentId in components) {
        const component = components[componentId];
        const mcpTools = await mcpListTools(context, componentId);
        await context.log({ step: 'mcp-server-list-tools', componentId, component, tools: mcpTools });

        for (const mcpTool of mcpTools) {
            const name = [shortuuid().fromUUID(componentId), mcpTool.name].join('_');
            const toolDefinition = {
                type: 'function',
                function: {
                    name,
                    description: mcpTool.description
                }
            };
            if (mcpTool.inputSchema) {
                toolDefinition.function.parameters = mcpTool.inputSchema;
            }
            if (
                toolDefinition.function.parameters &&
                toolDefinition.function.parameters.type === 'object' &&
                !toolDefinition.function.parameters.properties
            ) {
                toolDefinition.function.parameters.properties = {};
            }
            toolsDefinition.push(toolDefinition);
        }
    }

    return toolsDefinition;
}

// ─── MCP server communication ─────────────────────────────────────────────────

async function mcpListTools(context, componentId) {

    const { data } = await context.httpRequest({
        url: `${process.env.APPMIXER_API_URL}/flows/${context.flowId}/components/${componentId}?action=listTools`,
        method: 'POST',
        data: {}
    });
    return data;
}

async function mcpCallTool(context, componentId, toolName, args) {

    const { data } = await context.httpRequest({
        url: `${process.env.APPMIXER_API_URL}/flows/${context.flowId}/components/${componentId}?action=callTool`,
        method: 'POST',
        data: {
            name: toolName,
            arguments: args,
            correlationId: context.messages?.in?.correlationId
        }
    });
    return data;
}

function isMCPserver(context, componentId) {

    const component = context.flowDescriptor[componentId];
    if (!component) return false;
    const category = component.type.split('.').slice(0, 2).join('.');
    const type = component.type.split('.').at(-1);
    return category === 'appmixer.mcpservers' && type === 'MCPServer';
}

// ─── Vercel AI SDK tool wrappers ──────────────────────────────────────────────

/**
 * Convert OpenAI-format tool definitions into Vercel AI SDK tool objects.
 * Each tool's execute function dispatches to the appropriate Appmixer component
 * or MCP server and returns the result as a string.
 *
 * @param {Function} [getStepCtx] - Optional. Returns the current model_step OTEL context
 *   at call-time so tool execution spans are correctly nested under the active step span.
 */
function buildVercelTools(context, toolsDefinition, tracer, getStepCtx) {

    if (!toolsDefinition || toolsDefinition.length === 0) return undefined;

    const tools = {};

    for (const toolDef of toolsDefinition) {
        const name = toolDef.function.name;
        const description = toolDef.function.description || '';
        const params = toolDef.function.parameters
            ? { ...toolDef.function.parameters }
            : { type: 'object', properties: {} };

        if (params.type === 'object' && !params.properties) {
            params.properties = {};
        }

        tools[name] = tool({
            description,
            parameters: jsonSchema(params),
            execute: async (args, options = {}) =>
                executeToolByName(context, name, args, tracer, options.toolCallId, getStepCtx)
        });
    }

    return tools;
}

/**
 * Dispatch a single tool call by name.
 * Handles both MCP server tools (direct HTTP) and Appmixer ToolStart chains (pub/sub + poll).
 *
 * When getStepCtx is provided, the tool execution span is explicitly parented to the
 * current model_step OTEL context so it appears nested under the correct step in Langfuse.
 */
async function executeToolByName(context, toolFullName, args, tracer, toolCallId, getStepCtx) {

    let componentId = toolFullName.split('_')[0];
    const toolName = toolFullName.split('_').slice(1).join('_');

    await lib.publishChatProgressEvent(context, 'tool-call', `Calling tool ${toolName}.`);

    if (!uuid.validate(componentId)) {
        componentId = shortuuid().toUUID(componentId);
    }

    const runTool = async () => {

        if (isMCPserver(context, componentId)) {
            try {
                const output = await mcpCallTool(context, componentId, toolName, args);
                return typeof output === 'string' ? output : JSON.stringify(output, null, 2);
            } catch (err) {
                await context.log({ step: 'mcp-call-tool-error', componentId, toolName, error: err.message });
                return `Error calling tool ${toolName}: ${err.message}`;
            }
        }

        // Appmixer ToolStart chain: send the call and poll flow state for the result.
        const callId = uuid.v4();
        await context.sendJson({
            toolCalls: [{ componentId, args, id: callId }],
            prompt: context.messages.in.content.prompt
        }, 'tools');

        const pollStart = Date.now();
        const pollTimeout = context.config.TOOLS_OUTPUT_POLL_TIMEOUT || TOOLS_OUTPUT_POLL_TIMEOUT;
        const pollInterval = context.config.TOOLS_OUTPUT_POLL_INTERVAL || TOOLS_OUTPUT_POLL_INTERVAL;

        while (Date.now() - pollStart < pollTimeout) {
            const result = await context.flow.stateGet(callId);
            if (result) {
                await context.flow.stateUnset(callId);
                return result.output;
            }
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        await context.log({ step: 'tool-call-timeout', toolCallId: callId, toolName, timeout: pollTimeout });
        return `Error: Tool ${toolName} timed out after ${pollTimeout}ms`;
    };

    if (!tracer) return runTool();

    const { SpanStatusCode } = require('@opentelemetry/api');
    // Use the current model_step context (from getStepCtx) so tool execution spans are
    // nested under the right step. Falls back to natural OTEL context propagation if
    // no step context is available.
    const stepCtx = getStepCtx ? getStepCtx() : null;
    const startToolSpan = stepCtx
        ? (name, cb) => tracer.startActiveSpan(name, {}, stepCtx, cb)
        : (name, cb) => tracer.startActiveSpan(name, cb);

    return startToolSpan(toolName, async (span) => {
        const inputJson = JSON.stringify(args);
        span.setAttributes({
            // gen_ai.* required for @langfuse/otel v5 isGenAISpan filter (keeps span from being dropped)
            'gen_ai.operation.name': 'execute_tool',
            'gen_ai.tool.name': toolName,
            // ai.toolCall.* is the Vercel AI SDK convention Langfuse uses to render
            // the tool-call visual badge in the trace view.
            'ai.toolCall.name': toolName,
            ...(toolCallId ? { 'ai.toolCall.id': toolCallId } : {}),
            'ai.toolCall.args': inputJson,
            'langfuse.observation.type': 'tool',
            'langfuse.observation.name': toolName,
            'input.value': inputJson,
            'input.mime_type': 'application/json',
            'langfuse.observation.input': inputJson,
            'appmixer.tool.name': toolName,
            'appmixer.tool.component.id': componentId,
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
    collectTools,
    getAllToolsDefinition,
    getToolsDefinition,
    getMCPToolsDefinition,
    mcpListTools,
    mcpCallTool,
    isMCPserver,
    buildVercelTools,
    executeToolByName
};
