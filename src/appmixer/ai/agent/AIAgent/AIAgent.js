'use strict';

const componentTool = require('../tool');
const agentModule = require('../agent');
const memory = require('../memory');
const lib = require('../lib');


module.exports = {

    /**
     * Appmixer start lifecycle: collect and cache tool definitions from the flow graph.
     */
    start: async function(context) {

        await componentTool.collectComponentTools(context);
    },

    /**
     * Appmixer receive lifecycle: orchestrate a full agent turn.
     *
     * 1. Rebuild tool definitions from cached manifests + live flowDescriptor
     * 2. Load agent memory for the thread
     * 3. Run the agentic loop
     * 4. Save new messages and updated memory back to the store
     * 5. Emit the answer
     */
    receive: async function(context) {

        await lib.publishChatProgressEvent(context, 'start', 'Thinking...');

        const receiveStart = Date.now();
        const { prompt, storeId, threadId, fileId } = context.messages.in.content;

        if (!prompt) {
            throw new context.CancelError('Prompt is required');
        }

        // Rebuild tool definitions on every receive() so "Model Defined Parameter" field
        // markings are always evaluated against the current flow configuration.
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
