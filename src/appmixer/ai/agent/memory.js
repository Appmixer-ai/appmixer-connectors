'use strict';

const crypto = require('crypto');
const tokenizer = require('gpt-tokenizer');
const lib = require('./lib');

// Short-term memory of a thread: a rolling summary of the older conversation plus the most recent
// turns verbatim. All limits can be overridden in the service configuration (context.config).

// Summary + recent messages above this many tokens trigger a compaction.
const MEMORY_RECENT_MESSAGES_TOKEN_BUDGET = 32000;
// A compaction keeps only this fraction of the budget in recent messages, so the next one is
// several turns away instead of on the very next turn.
const MEMORY_COMPACTION_TARGET_RATIO = 0.5;
// Hard cap (max output tokens) of the summarization call.
const MEMORY_SUMMARY_TOKEN_BUDGET = 16000;
// Length the summarizer is asked to stay under.
const MEMORY_SUMMARY_TARGET_WORDS = 1500;
// Longest tool result / text part kept in memory, in characters.
const MEMORY_MAX_CONTENT_CHARS = 20000;
// The whole turn (load, agent run, save) holds a lock on the thread.
const MEMORY_LOCK_TTL = 10 * 60 * 1000;
const MEMORY_LOCK_RETRY_DELAY = 500;

// Rough per-message overhead (role, separators) added to the content tokens.
const MESSAGE_TOKEN_OVERHEAD = 4;

const MEMORY_SUMMARY_INSTRUCTION = [
    'You maintain the long-running memory summary of a conversation between a user and an AI assistant.',
    'You are given the previous summary and the conversation messages that are about to be dropped',
    'from the context. Return the updated summary only.',
    '',
    'Use these sections, omitting the ones that would be empty:',
    '',
    '## Goals',
    'What the user is trying to achieve.',
    '## Decisions and preferences',
    'Decisions made, user preferences, requirements and constraints.',
    '## Facts',
    'Important details: names, identifiers, numbers, APIs, data structures, errors, results of tool calls.',
    '## Open items',
    'Open questions and unfinished tasks.',
    '',
    'Rules:',
    '- Merge the new messages into the previous summary; keep what is still relevant, drop what is obsolete.',
    '- Omit chit-chat, greetings, repetition and resolved minor details.',
    '- Do not invent facts.',
    '- Write compactly, in the language of the conversation.'
].join('\n');

function config(context, name, fallback) {

    const value = Number(context.config?.[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

function memoryKey(threadId) {

    return `agent_memory_${threadId}`;
}

function emptyMemory() {

    return { summary: '', messages: [] };
}

function normalizeContent(content) {

    if (typeof content === 'string') {
        return content;
    }
    if (content == null) {
        return '';
    }
    return JSON.stringify(content);
}

function countTokens(text) {

    return text ? tokenizer.countTokens(text) : 0;
}

function countMessageTokens(message) {

    return countTokens(normalizeContent(message?.content)) + MESSAGE_TOKEN_OVERHEAD;
}

function truncate(text, maxChars) {

    if (text.length <= maxChars) {
        return text;
    }
    return `${text.slice(0, maxChars)}… [truncated ${text.length - maxChars} characters]`;
}

/**
 * Make a message safe to keep in memory: binary parts (images, files) become a text placeholder
 * and oversized text parts and tool results are truncated. Returns a new message; the input,
 * which may still be needed for the model call, is not modified.
 */
function sanitizeMessage(message, maxChars = MEMORY_MAX_CONTENT_CHARS) {

    if (!message || typeof message !== 'object') {
        return message;
    }
    if (typeof message.content === 'string') {
        return { ...message, content: truncate(message.content, maxChars) };
    }
    if (!Array.isArray(message.content)) {
        return message;
    }

    const content = message.content.map(part => {
        if (!part || typeof part !== 'object') {
            return part;
        }
        switch (part.type) {
            case 'image':
                return { type: 'text', text: `[Attached image${part.mimeType ? ` (${part.mimeType})` : ''}]` };
            case 'file':
                return { type: 'text', text: `[Attached file${part.mimeType ? ` (${part.mimeType})` : ''}]` };
            case 'text':
                return typeof part.text === 'string' ? { ...part, text: truncate(part.text, maxChars) } : part;
            case 'tool-result': {
                const serialized = typeof part.result === 'string' ? part.result : JSON.stringify(part.result);
                if (typeof serialized !== 'string' || serialized.length <= maxChars) {
                    return part;
                }
                const truncated = { ...part, result: truncate(serialized, maxChars) };
                // May carry the same oversized (or binary) result.
                delete truncated['experimental_content'];
                return truncated;
            }
            default:
                return part;
        }
    });

    return { ...message, content };
}

function sanitizeMessages(messages, maxChars) {

    return (messages || []).filter(Boolean).map(message => sanitizeMessage(message, maxChars));
}

/**
 * Group messages into turns. A turn starts with a user message and holds everything up to the
 * next one, so an assistant tool call always stays with its tool result. Memory written before
 * user messages were stored has none; there, an assistant message following another assistant
 * message (i.e. not following a tool result) starts a turn.
 */
function groupIntoTurns(messages) {

    const turns = [];
    messages.forEach((message, i) => {
        const startsTurn = i === 0
            || message.role === 'user'
            || (message.role === 'assistant' && messages[i - 1].role === 'assistant');
        if (startsTurn) {
            turns.push([]);
        }
        turns[turns.length - 1].push(message);
    });
    return turns;
}

/**
 * Split messages into the newest turns that fit into maxTokens (`recent`) and everything before
 * them (`old`). The cut is always on a turn boundary and the newest turn is always kept.
 */
function splitMessagesByTokenBudget(messages, maxTokens) {

    if (!Array.isArray(messages)) {
        throw new TypeError('messages must be an array');
    }
    if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
        throw new TypeError('maxTokens must be a positive number');
    }

    const turns = groupIntoTurns(messages);
    let keptTokens = 0;
    let firstKeptTurn = turns.length;

    for (let i = turns.length - 1; i >= 0; i--) {
        const turnTokens = turns[i].reduce((sum, message) => sum + countMessageTokens(message), 0);
        if (i < turns.length - 1 && keptTokens + turnTokens > maxTokens) {
            break;
        }
        keptTokens += turnTokens;
        firstKeptTurn = i;
    }

    return {
        old: turns.slice(0, firstKeptTurn).flat(),
        recent: turns.slice(firstKeptTurn).flat()
    };
}

function formatMessagesForSummary(messages) {

    return messages
        .map((m, i) => `[${i + 1}] ${String(m.role).toUpperCase()}:\n${normalizeContent(m.content)}`)
        .join('\n\n');
}

/**
 * Fold `oldMessages` into the running summary. Always uses the model selected on the agent
 * (context.properties.model): the provider is chosen per flow, so no other model can be assumed
 * to exist for it.
 * langfuse: { tracer, otelApi } - when given, the call is recorded as a span under the active one.
 */
async function summarizeHistory(context, oldSummary, oldMessages, langfuse = {}) {

    // Required here, not at the top: keeps the pure helpers of this module loadable without the SDK.
    const { generateText } = require('ai');
    const provider = require('./provider');

    const { tracer: otelTracer, otelApi } = langfuse;
    const modelId = context.properties?.model;
    const targetWords = config(context, 'MEMORY_SUMMARY_TARGET_WORDS', MEMORY_SUMMARY_TARGET_WORDS);

    const prompt = [
        'Previous summary:',
        oldSummary || '(none)',
        '',
        'New conversation messages to incorporate:',
        formatMessagesForSummary(oldMessages),
        '',
        `Return the updated summary only, in at most ${targetWords} words.`
    ].join('\n');

    const span = otelTracer ? otelTracer.startSpan('Memory Summarization', {
        attributes: {
            'gen_ai.operation.name': 'chat',
            'gen_ai.request.model': modelId || '',
            'langfuse.observation.type': 'generation',
            'langfuse.observation.name': 'Memory Summarization',
            'langfuse.observation.input': prompt
        }
    }) : null;

    try {
        const result = await generateText({
            model: provider.createModel(context),
            system: config(context, 'MEMORY_SUMMARY_INSTRUCTION', MEMORY_SUMMARY_INSTRUCTION),
            prompt,
            maxTokens: config(context, 'MEMORY_SUMMARY_TOKEN_BUDGET', MEMORY_SUMMARY_TOKEN_BUDGET)
        });
        await lib.updateUsage(context, result.usage);
        if (span) {
            span.setAttributes({
                'langfuse.observation.output': result.text,
                'gen_ai.usage.input_tokens': result.usage?.promptTokens || 0,
                'gen_ai.usage.output_tokens': result.usage?.completionTokens || 0
            });
        }
        return result.text;
    } catch (err) {
        if (span && otelApi) {
            span.setStatus({ code: otelApi.SpanStatusCode.ERROR, message: err.message });
        }
        throw err;
    } finally {
        if (span) span.end();
    }
}

/**
 * Bring the memory back under the token budget: summarize the oldest turns and keep the newest
 * ones. Returns a new memory object; `compacted` tells whether anything was dropped.
 *
 * A failed summarization is not fatal: the history is kept as is and the next turn retries.
 * Only once the memory is twice over the budget are the oldest turns dropped without being
 * summarized, so that a persistently failing summarizer cannot grow the context without bound.
 */
async function compactMemory(context, memoryData, options = {}) {

    const { summarize = summarizeHistory, langfuse, threadId } = options;
    const budget = config(context, 'MEMORY_RECENT_MESSAGES_TOKEN_BUDGET', MEMORY_RECENT_MESSAGES_TOKEN_BUDGET);
    const ratio = Math.min(config(context, 'MEMORY_COMPACTION_TARGET_RATIO', MEMORY_COMPACTION_TARGET_RATIO), 1);

    const summary = memoryData.summary || '';
    const messages = memoryData.messages || [];
    const totalTokens = countTokens(summary)
        + messages.reduce((sum, message) => sum + countMessageTokens(message), 0);

    if (totalTokens <= budget) {
        return { summary, messages, compacted: false };
    }

    const { old, recent } = splitMessagesByTokenBudget(messages, Math.max(1, Math.floor(budget * ratio)));
    if (old.length === 0) {
        // A single turn larger than the budget: nothing older to summarize.
        return { summary, messages, compacted: false };
    }

    let newSummary;
    try {
        newSummary = await summarize(context, summary, old, langfuse);
    } catch (err) {
        const drop = totalTokens > 2 * budget;
        await context.log({
            step: 'memory-summarization-error',
            threadId,
            error: err.message,
            droppedMessagesCount: drop ? old.length : 0
        });
        return drop
            ? { summary, messages: recent, compacted: true }
            : { summary, messages, compacted: false };
    }

    await context.log({
        step: 'summarized-memory',
        threadId,
        oldMessagesCount: old.length,
        recentMessagesCount: recent.length,
        tokensBefore: totalTokens
    });

    return { summary: newSummary, messages: recent, compacted: true };
}

/**
 * Load the condensed conversation memory for a thread.
 * Falls back to component state when no store is configured. Missing or unreadable data yields
 * an empty memory rather than an error.
 */
async function loadMemory(context, storeId, threadId) {

    const key = memoryKey(threadId);
    const raw = storeId
        ? (await context.store.get(storeId, key))?.value
        : await context.stateGet(key);

    if (!raw) {
        return emptyMemory();
    }

    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
            summary: typeof parsed?.summary === 'string' ? parsed.summary : '',
            messages: Array.isArray(parsed?.messages) ? parsed.messages.filter(Boolean) : []
        };
    } catch (err) {
        await context.log({ step: 'memory-load-error', threadId, error: err.message });
        return emptyMemory();
    }
}

/**
 * Persist the condensed agent memory for a thread, compacting it first when it is over budget.
 * options: { langfuse, summarize } - see compactMemory().
 * Returns the memory as saved.
 */
async function saveMemory(context, storeId, threadId, memoryData, options = {}) {

    const maxChars = config(context, 'MEMORY_MAX_CONTENT_CHARS', MEMORY_MAX_CONTENT_CHARS);
    const { summary, messages } = await compactMemory(context, {
        summary: memoryData.summary,
        messages: sanitizeMessages(memoryData.messages, maxChars)
    }, { ...options, threadId });

    const saved = { summary, messages };
    const key = memoryKey(threadId);
    const value = JSON.stringify(saved);
    await (storeId
        ? context.store.set(storeId, key, value)
        : context.stateSet(key, value));
    return saved;
}

/**
 * Append the raw messages of a turn to the data store, one record per turn, so that other flows
 * can export the full history. Without a data store there is nothing to export to and the
 * component state would only grow, so nothing is written.
 */
async function appendMessages(context, storeId, threadId, newMessages) {

    if (!storeId) {
        return;
    }
    const maxChars = config(context, 'MEMORY_MAX_CONTENT_CHARS', MEMORY_MAX_CONTENT_CHARS);
    const key = `agent_messages_${threadId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    return context.store.set(storeId, key, JSON.stringify(sanitizeMessages(newMessages, maxChars)));
}

/**
 * Serialize the turns of one thread: memory is loaded, used and saved under this lock, so two
 * messages of the same thread cannot overwrite each other's turn. Waits up to the lock TTL for
 * a running turn to finish. The caller must unlock().
 */
function lockThread(context, storeId, threadId) {

    const ttl = config(context, 'MEMORY_LOCK_TTL', MEMORY_LOCK_TTL);
    // Memory in a data store is shared by every agent using that store; memory in the component
    // state is private to the component.
    const scope = storeId || `${context.flowId}:${context.componentId}`;
    return context.lock(`agent_memory:${scope}:${threadId}`, {
        ttl,
        retryDelay: MEMORY_LOCK_RETRY_DELAY,
        maxRetryCount: Math.ceil(ttl / MEMORY_LOCK_RETRY_DELAY)
    });
}

module.exports = {
    loadMemory,
    saveMemory,
    appendMessages,
    lockThread,
    // Exported for tests.
    sanitizeMessage,
    groupIntoTurns,
    splitMessagesByTokenBudget,
    compactMemory,
    countMessageTokens
};
