'use strict';

// Curated model lists for providers that do not expose a public /models REST endpoint.
const CURATED_MODELS = {
    'perplexity': [
        'sonar-pro', 'sonar', 'sonar-reasoning-pro', 'sonar-reasoning',
        'sonar-deep-research', 'r1-1776'
    ],
    'amazon-bedrock': [
        'anthropic.claude-3-5-sonnet-20241022-v2:0',
        'anthropic.claude-3-5-haiku-20241022-v1:0',
        'anthropic.claude-3-opus-20240229-v1:0',
        'amazon.nova-pro-v1:0',
        'amazon.nova-lite-v1:0',
        'amazon.nova-micro-v1:0',
        'meta.llama3-3-70b-instruct-v1:0',
        'meta.llama3-1-8b-instruct-v1:0',
        'mistral.mistral-large-2402-v1:0',
        'amazon.titan-text-premier-v1:0'
    ],
    'google-vertex': [
        'gemini-2.5-pro-preview-05-06',
        'gemini-2.5-flash-preview-05-20',
        'gemini-2.0-flash',
        'gemini-2.0-flash-thinking-exp',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b'
    ]
};

/**
 * Normalises auth fields from both validate context (fields on context directly)
 * and component context (context.auth).
 *
 * The auth dialog (auth.js) stores provider-specific fields under their own keys, because a
 * field is shown for one provider only: accessKeyId and awsRegion (Amazon Bedrock), location
 * (Google Vertex AI), azureEndpoint (Azure OpenAI). They are mapped to the common names here.
 * Accounts connected before the dialog had conditional fields stored these values as apiKey,
 * region and baseURL, which keep working.
 */
function resolveAuth(context) {

    const src = context.auth || context;
    return {
        provider: src.provider || 'openai',
        apiKey: src.apiKey || src.accessKeyId,
        secretKey: src.secretKey,
        region: src.region || src.awsRegion || src.location,
        projectId: src.projectId,
        baseURL: src.baseURL || src.azureEndpoint,
        customHeaders: src.customHeaders
    };
}

function parseHeaders(raw) {

    if (!raw) return undefined;
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (err) {
        throw new Error('Custom Headers must be valid JSON: ' + err.message);
    }
}

/**
 * Create a Vercel AI SDK LanguageModel for the given context.
 * Provider and credentials are read from context.auth.
 * To add a new provider: add a case here and the matching package to package.json.
 */
function createModel(context) {

    const { provider, apiKey, secretKey, region, projectId, baseURL, customHeaders } = resolveAuth(context);
    const modelId = context.properties.model;
    const headers = parseHeaders(customHeaders);

    switch (provider) {

    case 'openai': {
        const { createOpenAI } = require('@ai-sdk/openai');
        return createOpenAI({ apiKey, headers })(modelId);
    }
    case 'openai-compatible': {
        const { createOpenAI } = require('@ai-sdk/openai');
        return createOpenAI({ apiKey, baseURL, compatibility: 'compatible', headers })(modelId);
    }
    case 'anthropic': {
        const { createAnthropic } = require('@ai-sdk/anthropic');
        return createAnthropic({ apiKey, headers })(modelId);
    }
    case 'google': {
        const { createGoogleGenerativeAI } = require('@ai-sdk/google');
        return createGoogleGenerativeAI({ apiKey, headers })(modelId);
    }
    case 'mistral': {
        const { createMistral } = require('@ai-sdk/mistral');
        return createMistral({ apiKey, headers })(modelId);
    }
    case 'xai': {
        const { createXai } = require('@ai-sdk/xai');
        return createXai({ apiKey, headers })(modelId);
    }
    case 'cohere': {
        const { createCohere } = require('@ai-sdk/cohere');
        return createCohere({ apiKey, headers })(modelId);
    }
    case 'deepseek': {
        const { createDeepSeek } = require('@ai-sdk/deepseek');
        return createDeepSeek({ apiKey, headers })(modelId);
    }
    case 'groq': {
        const { createGroq } = require('@ai-sdk/groq');
        return createGroq({ apiKey, headers })(modelId);
    }
    case 'perplexity': {
        const { createPerplexity } = require('@ai-sdk/perplexity');
        return createPerplexity({ apiKey, headers })(modelId);
    }
    case 'togetherai': {
        const { createTogetherAI } = require('@ai-sdk/togetherai');
        return createTogetherAI({ apiKey, headers })(modelId);
    }
    case 'azure': {
        const { createAzure } = require('@ai-sdk/azure');
        const opt = { apiKey, headers };
        // Accept https://MY-RESOURCE.openai.azure.com and extract the resource name,
        // or pass through a fully custom baseURL.
        const azureMatch = baseURL && baseURL.match(/https?:\/\/([^.]+)\.openai\.azure\.com/i);
        if (azureMatch) {
            opt.resourceName = azureMatch[1];
        } else if (baseURL) {
            opt.baseURL = baseURL.replace(/\/$/, '') + '/openai';
        }
        return createAzure(opt)(modelId);
    }
    case 'amazon-bedrock': {
        const { createAmazonBedrock } = require('@ai-sdk/amazon-bedrock');
        return createAmazonBedrock({
            region: region || 'us-east-1',
            accessKeyId: apiKey,
            secretAccessKey: secretKey
        })(modelId);
    }
    case 'google-vertex': {
        const { createVertex } = require('@ai-sdk/google-vertex');
        return createVertex({
            project: projectId || process.env.GOOGLE_VERTEX_PROJECT,
            location: region || process.env.GOOGLE_VERTEX_LOCATION || 'us-central1'
        })(modelId);
    }
    default:
        throw new Error(`Unsupported AI provider: "${provider}"`);
    }
}

// Names under which the providers' model endpoints report the context window (input tokens).
const CONTEXT_WINDOW_FIELDS = [
    'max_input_tokens',     // Anthropic
    'inputTokenLimit',      // Google (Gemini)
    'context_window',       // Groq
    'context_length',       // Together AI, Cohere, OpenRouter
    'max_context_length',   // Mistral
    'max_model_len'         // vLLM
];

function readContextWindow(modelInfo) {

    if (!modelInfo || typeof modelInfo !== 'object') return undefined;
    for (const field of CONTEXT_WINDOW_FIELDS) {
        const value = Number(modelInfo[field]);
        if (Number.isFinite(value) && value > 0) return value;
    }
    return undefined;
}

/**
 * List available models for the provider configured in context.auth.
 * Returns an array of { id, contextWindow } objects, normalised across providers;
 * contextWindow (input tokens) is set only where the provider reports it.
 * For providers without a public listing endpoint, returns a curated list.
 * Works in both auth-validate context (fields on context) and component context (context.auth).
 */
async function listModels(context) {

    const { provider, apiKey, secretKey, region, projectId, baseURL, customHeaders } = resolveAuth(context);
    const extraHeaders = parseHeaders(customHeaders);

    const bearer = (key) => ({
        'Authorization': `Bearer ${key}`,
        ...extraHeaders
    });
    // contextWindow is undefined for providers that do not report it.
    const model = (id, info) => ({ id, contextWindow: readContextWindow(info) });

    switch (provider) {

    case 'openai': {
        const { data } = await context.httpRequest.get(
            'https://api.openai.com/v1/models',
            { headers: bearer(apiKey) }
        );
        return (data.data || []).map(m => model(m.id, m));
    }

    case 'openai-compatible': {
        if (!baseURL) throw new Error('Base URL is required for OpenAI-compatible providers.');
        const { data } = await context.httpRequest.get(
            `${baseURL.replace(/\/$/, '')}/models`,
            { headers: bearer(apiKey) }
        );
        return (data.data || []).map(m => model(m.id, m));
    }

    case 'anthropic': {
        const { data } = await context.httpRequest.get(
            'https://api.anthropic.com/v1/models?limit=1000',
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    ...extraHeaders
                }
            }
        );
        return (data.data || []).map(m => model(m.id, m));
    }

    case 'google': {
        const { data } = await context.httpRequest.get(
            `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${apiKey}`
        );
        return (data.models || [])
            .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
            .map(m => model(m.name.replace('models/', ''), m));
    }

    case 'mistral': {
        const { data } = await context.httpRequest.get(
            'https://api.mistral.ai/v1/models',
            { headers: bearer(apiKey) }
        );
        return (data.data || []).map(m => model(m.id, m));
    }

    case 'xai': {
        const { data } = await context.httpRequest.get(
            'https://api.x.ai/v1/models',
            { headers: bearer(apiKey) }
        );
        return (data.data || []).map(m => model(m.id, m));
    }

    case 'cohere': {
        const { data } = await context.httpRequest.get(
            'https://api.cohere.ai/v2/models',
            { headers: bearer(apiKey) }
        );
        return (data.models || [])
            .filter(m => (m.endpoints || []).includes('chat'))
            .map(m => model(m.name, m));
    }

    case 'deepseek': {
        const { data } = await context.httpRequest.get(
            'https://api.deepseek.com/v1/models',
            { headers: bearer(apiKey) }
        );
        return (data.data || []).map(m => model(m.id, m));
    }

    case 'groq': {
        const { data } = await context.httpRequest.get(
            'https://api.groq.com/openai/v1/models',
            { headers: bearer(apiKey) }
        );
        return (data.data || []).map(m => model(m.id, m));
    }

    case 'togetherai': {
        const { data } = await context.httpRequest.get(
            'https://api.together.xyz/v1/models',
            { headers: bearer(apiKey) }
        );
        // Together returns either { data: [...] } or a top-level array.
        const list = Array.isArray(data) ? data : (data.data || []);
        return list
            .filter(m => (m.type || '').toLowerCase() === 'chat' || !m.type)
            .map(m => model(m.id || m.name, m));
    }

    case 'perplexity': {
        // Perplexity does not expose a public models listing endpoint.
        return CURATED_MODELS['perplexity'].map(id => ({ id }));
    }

    case 'amazon-bedrock': {
        // Bedrock's listing API requires AWS Signature V4 signing.
        // Return a curated list of foundation models instead.
        return CURATED_MODELS['amazon-bedrock'].map(id => ({ id }));
    }

    case 'google-vertex': {
        // Vertex AI listing requires OAuth2 / ADC — return curated list.
        return CURATED_MODELS['google-vertex'].map(id => ({ id }));
    }

    case 'azure': {
        if (!baseURL) throw new Error('Endpoint is required for Azure OpenAI.');
        const endpoint = baseURL.replace(/\/$/, '');
        const { data } = await context.httpRequest.get(
            `${endpoint}/openai/models?api-version=2024-02-01`,
            { headers: { 'api-key': apiKey, ...extraHeaders } }
        );
        return (data.data || []).map(m => model(m.id, m));
    }

    default:
        throw new Error(`Unsupported AI provider: "${provider}"`);
    }
}

/**
 * The context windows of the provider's models, for the account's profile info: a list of
 * { id, contextWindow }. It is requested once, when the account is connected (auth.js,
 * requestProfileInfo), and reaches the components as context.profileInfo. Models whose
 * provider does not report the context window are left out.
 */
async function listContextWindows(context) {

    const models = await listModels(context);
    return models
        .filter(model => model.contextWindow)
        .map(({ id, contextWindow }) => ({ id, contextWindow }));
}

/**
 * The context window (in input tokens) of the model selected on the agent, from the profile
 * info of the connected account, or undefined when it is not there: the provider does not
 * report it, the model was released after the account was connected, or the account was
 * connected before context windows were recorded. Callers must have a default for that case.
 */
function getContextWindow(context) {

    const contextWindows = (context.profileInfo || context.auth?.profileInfo)?.contextWindows;
    if (!Array.isArray(contextWindows)) return undefined;
    const entry = contextWindows.find(model => model.id === context.properties?.model);
    const value = Number(entry?.contextWindow);
    return Number.isFinite(value) && value > 0 ? value : undefined;
}

module.exports = { createModel, listModels, listContextWindows, resolveAuth, getContextWindow };
