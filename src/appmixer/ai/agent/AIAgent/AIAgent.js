'use strict';

const lib = require('../lib');
const shortuuid = require('short-uuid');
const uuid = require('uuid');
const { generateText, streamText, jsonSchema, tool } = require('ai');

const TOOLS_OUTPUT_POLL_TIMEOUT = 2 * 60 * 1000;
const TOOLS_OUTPUT_POLL_INTERVAL = 300;
const AI_AGENT_MAX_ATTEMPTS = 20;
const AI_AGENT_MAX_HISTORY_SIZE = 512000;
const AI_AGENT_MAX_HISTORY_SUMMARY_TOKENS = 32000;
const AI_AGENT_MAX_FILE_SIZE = 1024 * 1024 * 5;

module.exports = {

    start: async function(context) {

        await this.collectTools(context);
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

        const tools = {};
        let error;

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
                arguments: args,
                correlationId: context.messages?.in?.correlationId
            }
        });

        return data;
    },

    isMCPserver: function(context, componentId) {

        const component = context.flowDescriptor[componentId];
        if (!component) return false;
        const category = component.type.split('.').slice(0, 2).join('.');
        const type = component.type.split('.').at(-1);
        return category === 'appmixer.mcpservers' && type === 'MCPServer';
    },

    getMCPToolsDefinition: async function(context) {

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
            const tools = await this.mcpListTools(context, componentId);
            await context.log({ step: 'mcp-server-list-tools', componentId, component, tools });

            for (const tool of tools) {
                const name = [shortuuid().fromUUID(componentId), tool.name].join('_');
                const toolDefinition = {
                    type: 'function',
                    function: {
                        name,
                        description: tool.description
                    }
                };
                if (tool.inputSchema) {
                    toolDefinition.function.parameters = tool.inputSchema;
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
    },

    getToolsDefinition: function(tools) {

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
    },

    /**
     * Convert OpenAI-format tool definitions into Vercel AI SDK tool objects.
     * Each tool's execute function dispatches to the appropriate Appmixer component
     * or MCP server and returns the result as a string.
     *
     * @param {Function} [getStepCtx] - Optional. Returns the current model_step OTEL context
     *   at call-time, so tool execution spans are correctly nested under the active step span.
     */
    buildVercelTools: function(context, toolsDefinition, tracer, getStepCtx) {

        if (!toolsDefinition || toolsDefinition.length === 0) return undefined;

        const tools = {};
        const self = this;

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
                    self.executeToolByName(context, name, args, tracer, options.toolCallId, getStepCtx)
            });
        }

        return tools;
    },

    /**
     * Dispatch a single tool call by name.
     * Handles both MCP server tools (direct HTTP) and Appmixer ToolStart chains (pub/sub + poll).
     *
     * When getStepCtx is provided, the tool execution span is explicitly parented to the
     * current model_step OTEL context so it appears nested under the correct step in Langfuse.
     */
    executeToolByName: async function(context, toolFullName, args, tracer, toolCallId, getStepCtx) {

        let componentId = toolFullName.split('_')[0];
        const toolName = toolFullName.split('_').slice(1).join('_');

        await this.publishChatProgressEvent(context, 'tool-call', `Calling tool ${toolName}.`);

        if (!uuid.validate(componentId)) {
            componentId = shortuuid().toUUID(componentId);
        }

        const runTool = async () => {

            if (this.isMCPserver(context, componentId)) {
                try {
                    const output = await this.mcpCallTool(context, componentId, toolName, args);
                    return typeof output === 'string' ? output : JSON.stringify(output, null, 2);
                } catch (err) {
                    await context.log({ step: 'mcp-call-tool-error', componentId, toolName, error: err.message });
                    return `Error calling tool ${toolName}: ${err.message}`;
                }
            }

            // Appmixer ToolStart chain: send the call and poll flow state for the result.
            const toolCallId = uuid.v4();
            await context.sendJson({
                toolCalls: [{ componentId, args, id: toolCallId }],
                prompt: context.messages.in.content.prompt
            }, 'tools');

            const pollStart = Date.now();
            const pollTimeout = context.config.TOOLS_OUTPUT_POLL_TIMEOUT || TOOLS_OUTPUT_POLL_TIMEOUT;
            const pollInterval = context.config.TOOLS_OUTPUT_POLL_INTERVAL || TOOLS_OUTPUT_POLL_INTERVAL;

            while (Date.now() - pollStart < pollTimeout) {
                const result = await context.flow.stateGet(toolCallId);
                if (result) {
                    await context.flow.stateUnset(toolCallId);
                    return result.output;
                }
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }

            await context.log({ step: 'tool-call-timeout', toolCallId, toolName, timeout: pollTimeout });
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
        return startToolSpan(`Tool: ${toolName}`, async (span) => {
            const inputJson = JSON.stringify(args);
            span.setAttributes({
                // gen_ai.* attribute is required for @langfuse/otel v5 isGenAISpan filter
                // Without it, LangfuseSpanProcessor silently drops the span.
                'gen_ai.operation.name': 'execute_tool',
                'gen_ai.tool.name': toolName,
                'langfuse.observation.type': 'span',
                'langfuse.observation.name': `Tool: ${toolName}`,
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
    },

    publishChatProgressEvent: function(context, step, content) {

        return context.pubSubPublish(`stream:agent:events:${context.messages.in.content.threadId}`, {
            type: 'progress',
            data: {
                id: uuid.v6(),
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

        return context.pubSubPublish(`stream:agent:events:${context.messages.in.content.threadId}`, {
            type: 'delta',
            data: {
                id: uuid.v6(),
                content,
                role: 'agent',
                correlationId: context.messages.in.correlationId,
                componentId: context.componentId,
                flowId: context.flowId
            }
        });
    },

    updateUsage: async function(context, usage) {

        if (!usage) return;

        const totalUsage = await context.stateGet('usage') || {};
        // Vercel AI SDK uses camelCase; guard against both formats.
        const promptTokens = usage.promptTokens ?? usage.prompt_tokens ?? 0;
        const completionTokens = usage.completionTokens ?? usage.completion_tokens ?? 0;
        const totalTokens = usage.totalTokens ?? usage.total_tokens ?? 0;

        return context.stateSet('usage', {
            prompt_tokens: (totalUsage.prompt_tokens || 0) + promptTokens,
            completion_tokens: (totalUsage.completion_tokens || 0) + completionTokens,
            total_tokens: (totalUsage.total_tokens || 0) + totalTokens
        });
    },

    /**
     * Build the content part(s) for the user message, handling image, PDF, and text files
     * using Vercel AI SDK content part types (image, file, text).
     */
    buildUserContent: async function(context, prompt, fileId) {

        if (!fileId) return prompt;

        let fileInfo;
        try {
            fileInfo = await context.getFileInfo(fileId);
        } catch (err) {
            throw new context.CancelError(`Failed to get file info: ${err.message}`);
        }

        const size = fileInfo.length;
        const maxSize = context.config.AI_AGENT_MAX_FILE_SIZE || AI_AGENT_MAX_FILE_SIZE;

        await this.publishChatProgressEvent(
            context,
            'file-processing',
            `Processing file ${fileInfo.filename} (${lib.formatBytes(size)})...`
        );

        if (size > maxSize) {
            throw new context.CancelError(
                `File size ${size} exceeds the maximum allowed size of ${maxSize} bytes.`
            );
        }

        const mime = fileInfo.contentType || 'application/octet-stream';

        try {
            const fileBuffer = await context.loadFile(fileId);

            if (['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'].includes(mime)) {
                return [
                    { type: 'image', image: fileBuffer, mimeType: mime },
                    { type: 'text', text: prompt }
                ];
            }

            if (mime === 'application/pdf') {
                return [
                    { type: 'file', data: fileBuffer, mimeType: 'application/pdf' },
                    { type: 'text', text: prompt }
                ];
            }

            // Other file types: read as plain text.
            await context.log({
                warning: `File type ${mime} is not an image or PDF. Parsed as text and sent as a regular prompt.`
            });
            return [
                { type: 'text', text: `File content:\n${fileBuffer.toString('utf8')}` },
                { type: 'text', text: prompt }
            ];
        } catch (err) {
            if (err instanceof context.CancelError) throw err;
            throw new context.CancelError(`Failed to process file: ${err.message}`);
        }
    },

    agent: async function(context, instructions, prompt, fileId, toolsDefinition, history) {

        const model = lib.createModel(context);
        const isStream = !!context.properties.stream;
        const maxSteps = context.config.AI_AGENT_MAX_ATTEMPTS || AI_AGENT_MAX_ATTEMPTS;

        const { provider: telemetryProvider, tracer, otelApi } = lib.createLangfuseTracer(context);
        const threadId = context.messages?.in?.content?.threadId;
        const telemetry = tracer ? {
            isEnabled: true,
            tracer,
            // Do NOT set functionId: it prefixes span names (e.g. "appmixer-ai-agent:ai.streamText.doStream")
            // which breaks Langfuse's OTLP ingestion name-matching for input/output/toolCalls mapping.
            recordInputs: true,
            recordOutputs: true,
            metadata: {
                sessionId: threadId,
                flowId: context.flowId,
                componentId: context.componentId,
                correlationId: context.messages?.in?.correlationId
            }
        } : { isEnabled: false };

        const userContent = await this.buildUserContent(context, prompt, fileId);
        const inputMessages = [
            ...history,
            { role: 'user', content: userContent }
        ];

        await context.log({ step: 'agent-start', isStream, maxSteps, historyLength: history.length });

        let finalText;
        let responseMessages;

        // run() is called inside the active agent span context (via otelContext.with) so that
        // buildVercelTools — and every tracer.startActiveSpan inside executeToolByName — inherits
        // the correct OTEL parent span without relying on async-context capture at definition time.
        const run = async () => {

            // getStepCtx returns the current model_step OTEL context; updated as steps progress
            // so tool execution spans parent under the right step span in Langfuse.
            let currentStepCtx = null;
            const getStepCtx = () => currentStepCtx;

            const tools = this.buildVercelTools(context, toolsDefinition, tracer, getStepCtx);

            const sharedOptions = {
                model,
                system: instructions || 'You are a helpful assistant.',
                messages: inputMessages,
                tools,
                maxSteps,
                experimental_telemetry: telemetry
            };

            if (isStream) {
                // Disable SDK auto-telemetry for streaming: we build spans manually
                // (generation → model_step → model_chunk/tool_call) so the trace hierarchy
                // matches what the user expects rather than the SDK's internal span tree.
                const streamOptions = {
                    ...sharedOptions,
                    experimental_telemetry: { isEnabled: false }
                };

                // Determine the OTEL trace/context module (available if Langfuse is active)
                const otelTrace = otelApi ? otelApi.trace : null;
                const otelCtx = otelApi ? otelApi.context : null;

                // Create a top-level "generation" span under the agent.
                // It holds the full input (system + initial messages) and the final text output.
                const agentCtx = otelCtx ? otelCtx.active() : null;
                const generationSpan = (tracer && agentCtx) ? tracer.startSpan('generation', {
                    attributes: {
                        'gen_ai.operation.name': 'generation',
                        // 'generation' type renders as a Langfuse Generation observation
                        // (shows model, I/O, token counts, cost in the UI)
                        'langfuse.observation.type': 'generation',
                        'langfuse.observation.name': 'generation',
                        'gen_ai.request.model': context.properties.model || '',
                        'langfuse.observation.input': JSON.stringify({
                            system: instructions,
                            messages: inputMessages
                        })
                    }
                }, agentCtx) : null;
                const generationCtx = (generationSpan && otelTrace && agentCtx)
                    ? otelTrace.setSpan(agentCtx, generationSpan)
                    : agentCtx;

                const result = streamText(streamOptions);

                let stepCount = 0;
                let currentStepSpan = null;
                let currentStepText = '';

                for await (const chunk of result.fullStream) {
                    switch (chunk.type) {

                    case 'step-start':
                        stepCount++;
                        currentStepText = '';
                        // Create a model_step span under the generation span.
                        if (tracer && generationCtx && otelTrace) {
                            currentStepSpan = tracer.startSpan('model_step', {
                                attributes: {
                                    'gen_ai.operation.name': 'model_step',
                                    'langfuse.observation.type': 'span',
                                    'langfuse.observation.name': `model_step_${stepCount}`,
                                    'appmixer.step.index': stepCount
                                }
                            }, generationCtx);
                            currentStepCtx = otelTrace.setSpan(generationCtx, currentStepSpan);
                        }
                        if (stepCount > 1) {
                            await this.publishChatProgressEvent(
                                context,
                                'inference',
                                `Crunching data (${stepCount})...`
                            );
                        }
                        break;

                    case 'text-delta':
                        currentStepText += chunk.textDelta;
                        await this.publishChatDeltaEvent(context, null, chunk.textDelta);
                        break;

                    case 'tool-call':
                        // model_chunk event: records the model's DECISION to call a tool + args.
                        // 'event' type is appropriate here — it's an instantaneous point-in-time
                        // observation (the model decided to call this tool with these args).
                        // The tool EXECUTION span is created separately in executeToolByName.
                        if (tracer && currentStepCtx && otelTrace) {
                            const toolDecisionSpan = tracer.startSpan(
                                `tool_call: ${chunk.toolName}`, {
                                    attributes: {
                                        'gen_ai.operation.name': 'tool_call',
                                        'langfuse.observation.type': 'event',
                                        'langfuse.observation.name': `tool_call: ${chunk.toolName}`,
                                        'langfuse.observation.input': JSON.stringify(chunk.args),
                                        'appmixer.tool.call.id': chunk.toolCallId
                                    }
                                }, currentStepCtx
                            );
                            toolDecisionSpan.end();
                        }
                        break;

                    case 'step-finish':
                        if (tracer && currentStepSpan && currentStepCtx) {
                            // model_chunk span for the text output of this step (if non-empty)
                            if (currentStepText.trim() && otelTrace) {
                                const textChunkSpan = tracer.startSpan('text', {
                                    attributes: {
                                        'gen_ai.operation.name': 'text',
                                        'langfuse.observation.type': 'span',
                                        'langfuse.observation.name': 'text',
                                        'langfuse.observation.output': currentStepText
                                    }
                                }, currentStepCtx);
                                textChunkSpan.end();
                            }
                            // Step input from the request body (messages sent to model)
                            const reqBody = chunk.request?.body;
                            let stepInput = null;
                            if (reqBody) {
                                try { stepInput = JSON.parse(reqBody); } catch { stepInput = reqBody; }
                            }
                            const stepOutput = {
                                text: chunk.text,
                                ...(chunk.toolCalls?.length ? {
                                    toolCalls: chunk.toolCalls.map(tc => ({
                                        name: tc.toolName,
                                        args: tc.args
                                    }))
                                } : {})
                            };
                            currentStepSpan.setAttributes({
                                ...(stepInput ? { 'langfuse.observation.input': JSON.stringify(stepInput) } : {}),
                                'langfuse.observation.output': JSON.stringify(stepOutput),
                                'gen_ai.usage.input_tokens': chunk.usage?.promptTokens || 0,
                                'gen_ai.usage.output_tokens': chunk.usage?.completionTokens || 0,
                                'gen_ai.request.model': context.properties.model || ''
                            });
                            currentStepSpan.end();
                        }
                        currentStepSpan = null;
                        currentStepCtx = null;
                        break;

                    default:
                        break;
                    }
                }

                // result.usage resolves after the stream is fully consumed.
                await this.updateUsage(context, await result.usage);

                finalText = await result.text;
                responseMessages = (await result.response).messages;

                // Close generation span: stamp final output and aggregated usage so
                // Langfuse can compute total cost for the generation.
                if (generationSpan) {
                    const genUsage = await context.stateGet('usage');
                    generationSpan.setAttributes({
                        'langfuse.observation.output': finalText || '',
                        'gen_ai.usage.input_tokens': genUsage?.prompt_tokens || 0,
                        'gen_ai.usage.output_tokens': genUsage?.completion_tokens || 0
                    });
                    generationSpan.end();
                }

            } else {
                let stepCount = 0;

                const result = await generateText({
                    ...sharedOptions,
                    onStepFinish: async ({ toolCalls }) => {
                        stepCount++;
                        if (toolCalls && toolCalls.length > 1) {
                            await this.publishChatProgressEvent(
                                context,
                                'tool-calls',
                                `Called ${toolCalls.length} tools.`
                            );
                        }
                        if (toolCalls && toolCalls.length > 0) {
                            await this.publishChatProgressEvent(
                                context,
                                'inference',
                                `Crunching data (${stepCount + 1})...`
                            );
                        }
                    }
                });

                // result.usage is the aggregated total across all steps.
                await this.updateUsage(context, result.usage);

                finalText = result.text;
                responseMessages = result.response.messages;
            }
        };

        if (telemetryProvider && tracer && otelApi) {
            const { context: otelContext, trace, SpanStatusCode } = otelApi;
            const agentSpan = tracer.startSpan('Appmixer AI Agent', {
                attributes: {
                    'gen_ai.operation.name': 'invoke_agent',
                    'langfuse.observation.type': 'agent',
                    'langfuse.trace.name': 'Appmixer AI Agent',
                    'langfuse.observation.input': JSON.stringify({ prompt }),
                    'input.value': JSON.stringify({ prompt }),
                    'input.mime_type': 'application/json',
                    ...(threadId ? { 'langfuse.session.id': threadId } : {}),
                    'appmixer.flow.id': context.flowId,
                    'appmixer.component.id': context.componentId,
                    'appmixer.correlation.id': context.messages?.in?.correlationId || ''
                }
            });
            await otelContext.with(
                trace.setSpan(otelContext.active(), agentSpan),
                async () => {
                    try {
                        await run();
                        // Stamp accumulated token usage on the agent span so Langfuse can
                        // compute and display total cost for the entire agent invocation.
                        const usage = await context.stateGet('usage');
                        if (usage) {
                            const inputTokens = usage.prompt_tokens || 0;
                            const outputTokens = usage.completion_tokens || 0;
                            agentSpan.setAttributes({
                                'gen_ai.usage.input_tokens': inputTokens,
                                'gen_ai.usage.output_tokens': outputTokens,
                                'gen_ai.request.model': context.properties.model || '',
                                'langfuse.observation.usage_details': JSON.stringify({
                                    input: inputTokens,
                                    output: outputTokens
                                })
                            });
                        }
                        agentSpan.setAttributes({
                            'langfuse.observation.output': finalText || '',
                            'output.value': finalText || '',
                            'output.mime_type': 'application/json'
                        });
                    } catch (err) {
                        agentSpan.recordException(err);
                        agentSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
                        throw err;
                    } finally {
                        agentSpan.end();
                        await telemetryProvider.forceFlush();
                    }
                }
            );
        } else {
            await run();
        }

        const newHistory = [...inputMessages, ...responseMessages];

        return {
            messages: newHistory,
            answer: finalText
        };
    },

    summarizeHistory: async function(context, history) {

        const model = lib.createModel(context);
        const prompt = [
            context.config.AI_AGENT_SUMMARY_PROMPT || 'Summarize the following conversation:',
            JSON.stringify(history, null, 2)
        ].join('\n');

        const result = await generateText({
            model,
            messages: [{ role: 'user', content: prompt }],
            maxTokens: context.config.AI_AGENT_MAX_HISTORY_SUMMARY_TOKENS || AI_AGENT_MAX_HISTORY_SUMMARY_TOKENS
        });

        await this.updateUsage(context, result.usage);
        return result.text;
    },

    receive: async function(context) {

        await this.publishChatProgressEvent(context, 'start', 'Thinking...');

        const receiveStart = Date.now();
        const { prompt, storeId, threadId, fileId } = context.messages.in.content;

        if (!prompt) {
            throw new context.CancelError('Prompt is required');
        }

        let toolsDefinition = await context.stateGet('tools');
        if (!toolsDefinition) {
            toolsDefinition = await this.collectTools(context);
        }

        let history = [];
        if (threadId) {
            history = await this.loadSummary(context, storeId, threadId);
        }

        const historyLength = history.length;
        const agentTimeStart = Date.now();

        const response = await this.agent(
            context,
            context.properties.instructions || 'You are a helpful assistant.',
            prompt,
            fileId,
            toolsDefinition,
            history
        );

        await context.log({ step: 'agent-response', time: Date.now() - agentTimeStart });

        const newMessages = response.messages.slice(historyLength);
        if (threadId) {
            await this.saveMessages(context, storeId, threadId, newMessages);
        }

        let newHistory = response.messages;
        const maxHistorySize = context.config.AI_AGENT_MAX_HISTORY_SIZE || AI_AGENT_MAX_HISTORY_SIZE;

        if (threadId && JSON.stringify(newHistory).length > maxHistorySize) {
            const summary = await this.summarizeHistory(context, newHistory);
            newHistory = [{ role: 'user', content: summary }];
            await context.log({
                step: 'summarized-history',
                threadId,
                newHistoryTextLength: summary.length
            });
        }

        if (threadId) {
            await this.saveSummary(context, storeId, threadId, newHistory);
        }

        return context.sendJson({
            answer: response.answer,
            prompt,
            usage: await context.stateGet('usage'),
            time: Date.now() - receiveStart
        }, 'out');
    },

    loadSummary: async function(context, storeId, threadId) {

        const key = `thread_summary_${threadId}`;
        const messagesString = storeId
            ? (await context.store.get(storeId, key)).value
            : await context.stateGet(key);
        return messagesString ? JSON.parse(messagesString) : [];
    },

    saveSummary: function(context, storeId, threadId, summary) {

        const key = `thread_summary_${threadId}`;
        const value = JSON.stringify(summary);
        return storeId
            ? context.store.set(storeId, key, value)
            : context.stateSet(key, value);
    },

    saveMessages: function(context, storeId, threadId, messages) {

        const key = `thread_memory_${threadId}_${Date.now()}`;
        const value = JSON.stringify(messages);
        return storeId
            ? context.store.set(storeId, key, value)
            : context.stateSet(key, value);
    }
};
