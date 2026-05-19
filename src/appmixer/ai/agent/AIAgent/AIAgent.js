'use strict';

const tools = require('../tools');
const agentModule = require('../agent');
const memory = require('../memory');
const lib = require('../lib');

const AI_AGENT_MAX_HISTORY_SIZE = 512000;

module.exports = {

    /**
     * Appmixer start lifecycle: collect and cache tool definitions from the flow graph.
     */
    start: async function(context) {

        await tools.collectTools(context);
    },

    /**
     * Appmixer receive lifecycle: orchestrate a full agent turn.
     *
     * 1. Load tool definitions (from state or rebuild from flow graph)
     * 2. Load conversation history for the thread
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

        let history = [];
        if (threadId) {
            history = await memory.loadSummary(context, storeId, threadId);
        }

        const historyLength = history.length;
        const agentTimeStart = Date.now();

        const response = await agentModule.agent(
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
            await memory.saveMessages(context, storeId, threadId, newMessages);
        }

        let newHistory = response.messages;
        const maxHistorySize = context.config.AI_AGENT_MAX_HISTORY_SIZE || AI_AGENT_MAX_HISTORY_SIZE;

        if (threadId && JSON.stringify(newHistory).length > maxHistorySize) {
            const summary = await memory.summarizeHistory(context, newHistory);
            newHistory = [{ role: 'user', content: summary }];
            await context.log({
                step: 'summarized-history',
                threadId,
                newHistoryTextLength: summary.length
            });
        }

        if (threadId) {
            await memory.saveSummary(context, storeId, threadId, newHistory);
        }

        return context.sendJson({
            answer: response.answer,
            prompt,
            usage: await context.stateGet('usage'),
            time: Date.now() - receiveStart
        }, 'out');
    }
};
