'use strict';

const { generateText } = require('ai');
const provider = require('./provider');
const lib = require('./lib');

const AI_AGENT_MAX_HISTORY_SUMMARY_TOKENS = 32000;

/**
 * Summarise a full conversation history into a compact representation.
 * Uses the configured model and a configurable summary prompt.
 */
async function summarizeHistory(context, history) {

    const model = provider.createModel(context);
    const prompt = [
        context.config.AI_AGENT_SUMMARY_PROMPT || 'Summarize the following conversation:',
        JSON.stringify(history, null, 2)
    ].join('\n');

    const result = await generateText({
        model,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: context.config.AI_AGENT_MAX_HISTORY_SUMMARY_TOKENS || AI_AGENT_MAX_HISTORY_SUMMARY_TOKENS
    });

    await lib.updateUsage(context, result.usage);
    return result.text;
}

/**
 * Load the condensed conversation summary for a thread.
 * Falls back to component state when no store is configured.
 */
async function loadSummary(context, storeId, threadId) {

    const key = `thread_summary_${threadId}`;
    const messagesString = storeId
        ? (await context.store.get(storeId, key)).value
        : await context.stateGet(key);
    return messagesString ? JSON.parse(messagesString) : [];
}

/**
 * Persist the condensed conversation summary for a thread.
 */
function saveSummary(context, storeId, threadId, summary) {

    const key = `thread_summary_${threadId}`;
    const value = JSON.stringify(summary);
    return storeId
        ? context.store.set(storeId, key, value)
        : context.stateSet(key, value);
}

/**
 * Append raw new messages to persistent memory (keyed by timestamp).
 */
function saveMessages(context, storeId, threadId, messages) {

    const key = `thread_memory_${threadId}_${Date.now()}`;
    const value = JSON.stringify(messages);
    return storeId
        ? context.store.set(storeId, key, value)
        : context.stateSet(key, value);
}

module.exports = {
    summarizeHistory,
    loadSummary,
    saveSummary,
    saveMessages
};
