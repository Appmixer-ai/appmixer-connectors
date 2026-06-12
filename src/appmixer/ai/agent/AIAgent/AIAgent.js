'use strict';

const tools = require('../tools');
const componentTool = require('../tool');
const agentModule = require('../agent');
const memory = require('../memory');
const lib = require('../lib');


module.exports = {

    /**
     * Appmixer start lifecycle: collect and cache tool definitions from the flow graph.
     */
    start: async function(context) {

        await tools.collectTools(context);
        await componentTool.collectComponentTools(context);
    },

    /**
     * Appmixer receive lifecycle: orchestrate a full agent turn.
     *
     * 1. Load tool definitions (from state or rebuild from flow graph)
     * 2. Load agent memory for the thread
     * 3. Run the agentic loop
     * 4. Save new messages and a condensed summary back to the store
     * 5. Emit the answer
     */
    receive: async function(context) {

        await lib.publishChatProgressEvent(context, 'start', 'Thinking...');

        const receiveStart = Date.now();
        const { prompt, storeId, threadId, fileId } = context.messages.in.content;

        if (!prompt) {
            throw new context.CancelError('Prompt is required');
        }

        let toolsDefinition = await context.stateGet('tools');
        if (!toolsDefinition) {
            toolsDefinition = await tools.collectTools(context);
        }

        // Rebuild component tool definitions from cached manifests + live flowDescriptor
        // on every receive() so "Model Defined Parameter" field markings are always
        // evaluated against the current flow configuration.
        const componentToolsDef = await componentTool.buildComponentToolDefs(context);

        let memoryData = {};
        if (threadId) {
            memoryData = await memory.loadMemory(context, storeId, threadId);
        }

        const agentTimeStart = Date.now();

        const response = await agentModule.agent(
            context,
            context.properties.instructions || 'You are a helpful assistant.',
            prompt,
            fileId,
            toolsDefinition,
            componentToolsDef,
            memoryData
        );

        await context.log({ step: 'agent-response', latency: Date.now() - agentTimeStart });

        if (threadId) {
            const newMessages = response.messages;
            await memory.appendMessages(context, storeId, threadId, newMessages);

            memoryData.messages = memoryData.messages.concat(newMessages);
            await memory.saveMemory(context, storeId, threadId, memoryData);
        }

        return context.sendJson({
            answer: response.answer,
            prompt,
            usage: await context.stateGet('usage'),
            time: Date.now() - receiveStart
        }, 'out');
    }
};
