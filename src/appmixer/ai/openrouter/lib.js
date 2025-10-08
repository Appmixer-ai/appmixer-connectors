const Redis = require('ioredis');
const fs = require('fs').promises;
const shortuuid = require('short-uuid');
const uuid = require('uuid');

const TOOLS_OUTPUT_POLL_TIMEOUT = 2 * 60 * 1000;  // 120 seconds
const TOOLS_OUTPUT_POLL_INTERVAL = 300;  // 300ms


module.exports = {

    request: async function(context, method, endpoint, data, options = {}, extraHeaders = {}) {

        const baseUrl = context.config.llmBaseUrl || 'https://openrouter.ai/api/v1';
        const url = baseUrl + endpoint;
        const headers = {
            'Authorization': `Bearer ${context.apiKey || context.auth.apiKey}`,
            'Content-Type': 'application/json',
            ...extraHeaders
        };
        if (context.config.llmDefaultHeaders) {
            const defaultHeaders = JSON.parse(context.config.llmDefaultHeaders);
            Object.keys(defaultHeaders).forEach(key => {
                headers[key] = defaultHeaders[key];
            });
        }
        if (method === 'get' || method === 'delete') {
            return context.httpRequest[method](url, { headers });
        } else {
            return context.httpRequest[method](url, data, {
                headers,
                ...options
            });
        }
    },

    formatBytes: function(bytes, decimals = 2) {

        if (!+bytes) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    publish: async function(channel, event) {

        let redisPub = process.CONNECTOR_STREAM_PUB_CLIENT;
        if (!redisPub) {
            redisPub = process.CONNECTOR_STREAM_PUB_CLIENT = await this.connectRedis();
        }
        return redisPub.publish(channel, JSON.stringify(event));
    },

    connectRedis: async function() {

        const connection = {
            uri: process.env.REDIS_URI,
            mode: process.env.REDIS_MODE || 'standalone',
            sentinels: process.env.REDIS_SENTINELS,
            sentinelMasterName: process.env.REDIS_SENTINEL_MASTER_NAME,
            sentinelRedisPassword: process.env.REDIS_SENTINEL_PASSWORD,
            enableTLSForSentinelMode: process.env.REDIS_SENTINEL_ENABLE_TLS,
            caPath: process.env.REDIS_CA_PATH,
            useSSL: process.env.REDIS_USE_SSL === 'true' || parseInt(process.env.REDIS_USE_SSL) > 0
        };

        const options = {};
        if (connection.useSSL) {
            options.tls = {
                ca: connection.caPath ? await fs.readFile(connection.caPath) : undefined
            };
        }

        let client;

        if (connection.mode === 'replica' && connection.sentinels) {

            const sentinelsArray = connection.sentinels.split(',');

            client = new Redis({
                sentinels: sentinelsArray,
                name: connection.sentinelMasterName,
                ...(connection.sentinelRedisPassword ? { password: connection.sentinelRedisPassword } : {}),
                ...(connection.enableTLSForSentinelMode ?
                    { enableTLSForSentinelMode: connection.enableTLSForSentinelMode } : {})
            });
        } else {
            client = connection.uri ? new Redis(connection.uri, options) : new Redis();
        }

        return client;
    },

    collectTools: async function(context) {

        const tools = await this.getAllToolsDefinition(context);
        await context.log({ step: 'tools', tools });
        await context.stateSet('tools', tools);
        return tools;
    },

    getAllToolsDefinition: async function(context) {

        const flowDescriptor = context.flowDescriptor;
        const agentComponentId = context.componentId;
        const toolsPort = 'tools';

        // Create a new assistant with tools defined in the branches connected to my 'tools' output port.
        const tools = {};
        let error;

        // Find all components connected to my 'tools' output port.
        Object.keys(flowDescriptor).forEach((componentId) => {
            const component = flowDescriptor[componentId];
            const sources = component.source;
            Object.keys(sources || {}).forEach((inPort) => {
                const source = sources[inPort];
                if (source[agentComponentId] && source[agentComponentId].includes(toolsPort)) {
                    tools[componentId] = component;
                    if (component.type !== 'appmixer.ai.agenttools.ToolStart') {
                        error = `Component ${componentId} is not of type 'ToolStart' but ${component.type}.
                            Every tool chain connected to the '${toolsPort}' port of the AI Agent
                            must start with 'ToolStart' and end with 'ToolOutput'.
                            This is where you describe what the tool does and what parameters should the AI model provide to it.`;
                    }
                }
            });
        });

        // Teach the user via logs that they need to use the 'ToolStart' component.
        if (error) {
            throw new context.CancelError(error);
        }

        const toolsDefinition = this.getToolsDefinition(tools);
        const mcpToolsDefinition = await this.getMCPToolsDefinition(context);
        return toolsDefinition.concat(mcpToolsDefinition);
    },

    mcpListTools: async function(context, componentId) {

        const { data } = await context.httpRequest({
            url: `${process.env.APPMIXER_API_URL}/flows/${context.flowId}/components/${componentId}?action=listTools`,
            method: 'POST',
            data: {}
        });

        return data;
    },

    mcpCallTool: async function(context, componentId, toolName, args) {

        const { data } = await context.httpRequest({
            url: `${process.env.APPMIXER_API_URL}/flows/${context.flowId}/components/${componentId}?action=callTool`,
            method: 'POST',
            data: {
                name: toolName,
                arguments: args
            }
        });

        return data;
    },

    isMCPserver: function(context, componentId) {
        // Check if the component is an MCP server.
        const component = context.flowDescriptor[componentId];
        if (!component) {
            return false;
        }
        const category = component.type.split('.').slice(0, 2).join('.');
        const type = component.type.split('.').at(-1);
        if (category === 'appmixer.mcpservers' && type === 'MCPServer') {
            return true;
        }
        return false;
    },

    getMCPToolsDefinition: async function(context) {

        // https://platform.openai.com/docs/assistants/tools/function-calling
        const toolsDefinition = [];

        const flowDescriptor = context.flowDescriptor;
        const agentComponentId = context.componentId;
        const mcpPort = 'mcp';
        const components = {};
        let error;
        // Find all components connected to my 'mcp' output port.
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

        // Teach the user via logs that they need to connect only MCP servers to the mcp port.
        if (error) {
            throw new context.CancelError(error);
        }

        for (const componentId in components) {
            // For each 'MCP Server' component, call the component to retrieve available tools.
            const component = components[componentId];
            const tools = await this.mcpListTools(context, componentId);
            await context.log({ step: 'mcp-server-list-tools', componentId, component, tools });

            for (const tool of tools) {
                // Note we convert the UUID component ID to a shorter version
                // to avoid exceeding the 64 characters limit of the function name.
                const name = [shortuuid().fromUUID(componentId), tool.name].join('_');
                const toolDefinition = {
                    type: 'function',
                    function: {
                        name,
                        description: tool.description || ''
                    }
                };
                if (tool.inputSchema) {
                    toolDefinition.function.parameters = tool.inputSchema;
                }
                if (toolDefinition.function.parameters && toolDefinition.function.parameters.type === 'object' && !toolDefinition.function.parameters.properties) {
                    toolDefinition.function.parameters.properties = {};
                }
                toolsDefinition.push(toolDefinition);
            }
        }

        return toolsDefinition;
    },

    getToolsDefinition: function(tools) {

        // https://platform.openai.com/docs/assistants/tools/function-calling
        const toolsDefinition = [];

        Object.keys(tools).forEach((componentId) => {
            const component = tools[componentId];
            const parameters = component.config.properties.parameters?.ADD || [];
            const toolParameters = {
                type: 'object',
                properties: {}
            };
            parameters.forEach((parameter) => {
                // Skip empty objects
                if (Object.keys(parameter).length === 0) {
                    return;
                }
                toolParameters.properties[parameter.name] = {
                    type: parameter.type,
                    description: parameter.description || ''
                };
            });
            let toolName = (component.label || component.type.split('.').pop());
            toolName = toolName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 64 - componentId.length - 1);
            const toolDefinition = {
                type: 'function',
                function: {
                    name: componentId + '_' + toolName,
                    description: component.config.properties.description || ''
                }
            };
            if (parameters.length) {
                toolDefinition.function.parameters = toolParameters;
            }
            toolsDefinition.push(toolDefinition);
        });
        return toolsDefinition;
    },

    publishChatProgressEvent: function(context, step, content) {

        return this.publish(`stream:agent:events:${context.messages.in.content.threadId}`, {
            type: 'progress',
            data: {
                id: uuid.v6(), // UUID v6 is time ordered
                step,
                content,
                role: 'agent',
                correlationId: context.messages.in.correlationId,
                componentId: context.componentId,
                flowId: context.flowId
            }
        });
    },

    publishChatDeltaEvent: async function(context, completionId, content) {

        return this.publish(`stream:agent:events:${context.messages.in.content.threadId}`, {
            type: 'delta',
            data: {
                id: uuid.v6(), // UUID v6 is time ordered
                content,
                role: 'agent',
                correlationId: context.messages.in.correlationId,
                componentId: context.componentId,
                flowId: context.flowId
            }
        });
    },

    callTools: async function(context, modelToolCalls) {

        if (!modelToolCalls || !modelToolCalls.length) {
            return [];
        }

        if (modelToolCalls.length > 1) {
            await this.publishChatProgressEvent(context, 'tool-calls', `Calling ${modelToolCalls.length} tools.`);
        }

        const outputs = [];

        const toolCalls = [];
        for (const toolCall of modelToolCalls) {
            let componentId = toolCall.function.name.split('_')[0];
            const toolName = toolCall.function.name.split('_').slice(1).join('_');
            await this.publishChatProgressEvent(context, 'tool-call', `Calling tool ${toolName}.`);
            if (!uuid.validate(componentId)) {
                // Short version of the UUID.
                // Get back the original component UUID back from the short version.
                componentId = shortuuid().toUUID(componentId);
            }
            let args;
            try {
                args = JSON.parse(toolCall.function.arguments);
            } catch (err) {
                await context.log({
                    step: 'tool-call-json-parse-error',
                    toolCallId: toolCall.id,
                    toolName: toolCall.function.name,
                    arguments: toolCall.function.arguments,
                    error: err.message
                });
                // Add error response for malformed JSON arguments
                outputs.push({
                    tool_call_id: toolCall.id,
                    output: `Error: Failed to parse tool arguments - ${err.message}. Raw arguments: ${toolCall.function.arguments}`
                });
                continue;
            }
            if (this.isMCPserver(context, componentId)) {
                // MCP Server. Get output directly.
                let output;
                // Catch errors so that we don't trigger an Appmixer component retry.
                // Simply return the error message instead.
                try {
                    output = await this.mcpCallTool(
                        context,
                        componentId,
                        toolName,
                        args
                    );
                } catch (err) {
                    await context.log({ step: 'call-tool-error', componentId, toolName, toolCall, err });
                    output = `Error calling tool ${toolName}: ${err.message}`;
                }
                output = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
                outputs.push({ tool_call_id: toolCall.id, output });
            } else {
                // Regular Appmixer tool chain.
                toolCalls.push({ componentId, args, id: toolCall.id });
            }
        }

        if (toolCalls.length > 0) {

            // Send to all tools. Each ai.ToolStart ignores tool calls that are not intended for it.
            await context.sendJson({ toolCalls, prompt: context.messages.in.content.prompt }, 'tools');

            // Output of each tool is expected to be stored in the service state
            // under the ID of the tool call. This is done in the ToolStartOutput component.
            // Collect outputs of all the required tool calls.
            await context.log({ step: 'collect-tools-output', toolCalls });

            const pollStart = Date.now();
            const pollTimeout = context.config.TOOLS_OUTPUT_POLL_TIMEOUT || TOOLS_OUTPUT_POLL_TIMEOUT;
            const pollInterval = context.config.TOOLS_OUTPUT_POLL_INTERVAL || TOOLS_OUTPUT_POLL_INTERVAL;
            const collectedToolCallIds = new Set();

            while (
                (collectedToolCallIds.size < toolCalls.length) &&
                (Date.now() - pollStart < pollTimeout)
            ) {
                for (const toolCall of toolCalls) {
                    if (!collectedToolCallIds.has(toolCall.id)) {
                        const result = await context.flow.stateGet(toolCall.id);
                        if (result) {
                            outputs.push({ tool_call_id: toolCall.id, output: result.output });
                            collectedToolCallIds.add(toolCall.id);
                            await context.flow.stateUnset(toolCall.id);
                        }
                    }
                }
                // Sleep.
                await new Promise((resolve) => setTimeout(resolve, pollInterval));
            }
            await context.log({ step: 'collected-tools-output', outputs });
        }

        // Ensure we have responses for ALL tool calls
        // OpenAI requires a response to every tool_call_id
        const providedToolCallIds = new Set(outputs.map(output => output.tool_call_id));
        for (const toolCall of modelToolCalls) {
            if (!providedToolCallIds.has(toolCall.id)) {
                // Add error response for missing tool calls
                const pollTimeout = context.config.TOOLS_OUTPUT_POLL_TIMEOUT || TOOLS_OUTPUT_POLL_TIMEOUT;
                outputs.push({
                    tool_call_id: toolCall.id,
                    output: `Error: Tool call ${toolCall.function.name} timed out or failed to respond within ${pollTimeout}ms`
                });
                await context.log({
                    step: 'tool-call-timeout',
                    toolCallId: toolCall.id,
                    toolName: toolCall.function.name,
                    timeout: pollTimeout
                });
            }
        }

        return outputs;
    },

    updateUsage: async function(context, usage) {

        /* eslint-disable max-len */
        const totalUsage = await context.stateGet('usage') || {};
        const newUsage = {
            prompt_tokens: (totalUsage.prompt_tokens || 0) + (usage.prompt_tokens || 0),
            completion_tokens: (totalUsage.completion_tokens || 0) + (usage.completion_tokens || 0),
            total_tokens: (totalUsage.total_tokens || 0) + (usage.total_tokens || 0)
        };
        if (usage.prompt_tokens_details) {
            newUsage.prompt_tokens_details = {
                cached_tokens: (totalUsage?.prompt_tokens_details?.cached_tokens || 0) + (usage.prompt_tokens_details.cached_tokens || 0),
                audio_tokens: (totalUsage?.prompt_tokens_details?.audio_tokens || 0) + (usage.prompt_tokens_details.audio_tokens || 0)
            };
        }
        if (usage.completion_tokens_details) {
            newUsage.completion_tokens_details = {
                reasoning_tokens: (totalUsage?.completion_tokens_details?.reasoning_tokens || 0) + (usage.completion_tokens_details.reasoning_tokens || 0),
                audio_tokens: (totalUsage?.completion_tokens_details?.audio_tokens || 0) + (usage.completion_tokens_details.audio_tokens || 0),
                accepted_prediction_tokens: (totalUsage?.completion_tokens_details?.accepted_prediction_tokens || 0) + (usage.completion_tokens_details.accepted_prediction_tokens || 0),
                rejected_prediction_tokens: (totalUsage?.completion_tokens_details?.rejected_prediction_tokens || 0) + (usage.completion_tokens_details.rejected_prediction_tokens || 0)
            };
        }
        /* eslint-enable max-len */
        return context.stateSet('usage', newUsage);
    },

    loadSummary: async function(context, storeId, threadId) {

        const key = `thread_summary_${threadId}`;
        const messagesString = storeId
            ? (await context.store.get(storeId, key))?.value
            : await context.stateGet(key);
        const messages = messagesString ? JSON.parse(messagesString) : [];
        return messages;
    },

    saveSummary: function(context, storeId, threadId, summary) {

        const key = `thread_summary_${threadId}`;
        const value = JSON.stringify(summary);
        return storeId
            ? context.store.set(storeId, key, value)
            : context.stateSet(key, value);
    },

    saveMessages: function(context, storeId, threadId, messages) {

        const key = `thread_memory_${threadId}_${(new Date).getTime()}`;
        const value = JSON.stringify(messages);
        return storeId
            ? context.store.set(storeId, key, value)
            : context.stateSet(key, value);
    }
};
