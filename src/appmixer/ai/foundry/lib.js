'use strict';

const OpenAI = require('openai');

// Hosts a Foundry / Azure OpenAI resource endpoint can live on. The account's API key is sent
// to the endpoint, so anything else is refused. More suffixes (an Azure API Management gateway
// in front of Foundry, e.g. '.azure-api.net') can be allowed through the connector configuration
// 'allowedEndpointHosts' (comma-separated).
const ALLOWED_HOST_SUFFIXES = [
    '.openai.azure.com',
    '.services.ai.azure.com',
    '.cognitiveservices.azure.com',
    '.openai.azure.us',
    '.cognitiveservices.azure.us',
    '.openai.azure.cn',
    '.cognitiveservices.azure.cn'
];

// The OpenAI compatible v1 API of the resource. No 'api-version' query parameter is needed.
const API_PATH = '/openai/v1';

module.exports = {

    /**
     * The origin of the resource endpoint stored in the account. Accepts what users copy from
     * the Azure portal or the Foundry portal: the bare resource endpoint, the v1 base URL or the
     * project endpoint (https://<resource>.services.ai.azure.com/api/projects/<project>).
     * @param {object} context Auth or component context.
     * @returns {string} e.g. 'https://my-resource.openai.azure.com'
     */
    endpointOrigin(context) {

        const raw = (context.endpoint || context.auth?.endpoint || '').trim();
        if (!raw) {
            throw new Error('Endpoint is required. Find it in the Azure portal under your resource, '
                + '"Keys and Endpoint", e.g. https://my-resource.openai.azure.com.');
        }
        let parsed;
        try {
            parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
        } catch (err) {
            throw new Error(`Endpoint is not a valid URL: ${raw}`);
        }
        if (parsed.protocol !== 'https:') {
            throw new Error('Endpoint must use https.');
        }
        if (parsed.username || parsed.password) {
            throw new Error('Endpoint must not contain credentials.');
        }
        const host = parsed.hostname.toLowerCase();
        const extra = (context.config?.allowedEndpointHosts || '')
            .split(',')
            .map(suffix => suffix.trim().toLowerCase())
            .filter(Boolean)
            .map(suffix => (suffix.startsWith('.') ? suffix : `.${suffix}`));
        const allowed = ALLOWED_HOST_SUFFIXES.concat(extra);
        if (!allowed.some(suffix => host.endsWith(suffix) && host.length > suffix.length)) {
            throw new Error(`Endpoint host ${host} is not an Azure AI Foundry / Azure OpenAI host `
                + `(${ALLOWED_HOST_SUFFIXES.slice(0, 3).join(', ')}, ...).`);
        }
        return parsed.origin;
    },

    baseUrl(context) {

        return module.exports.endpointOrigin(context) + API_PATH;
    },

    apiKey(context) {

        return context.apiKey || context.auth?.apiKey;
    },

    authHeaders(context) {

        return { 'api-key': module.exports.apiKey(context) };
    },

    /**
     * Resolve a Make API Call URL against the account's resource and refuse any other origin.
     * Paths under '/openai/' or '/api/' (Foundry projects) are taken from the resource root,
     * any other relative path from the v1 API ('/chat/completions').
     */
    resolveApiUrl(context, url) {

        const origin = module.exports.endpointOrigin(context);
        const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
        let candidate = url;
        if (!isAbsolute) {
            const path = url.startsWith('/') ? url : `/${url}`;
            candidate = /^\/(openai|api)\//.test(path) ? path : API_PATH + path;
        }
        let parsed;
        try {
            parsed = new URL(candidate, origin);
        } catch (err) {
            throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
        }
        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }
        if (parsed.origin !== origin) {
            throw new context.CancelError(`API Endpoint Path must target ${origin}, got ${parsed.origin}.`);
        }
        return parsed.toString();
    },

    request: async function(context, method, endpoint, data, options = {}, extraHeaders = {}) {

        const url = module.exports.baseUrl(context) + endpoint;
        const headers = {
            ...module.exports.authHeaders(context),
            'Content-Type': 'application/json',
            ...extraHeaders
        };
        if (method === 'get' || method === 'delete') {
            return context.httpRequest[method](url, { headers });
        }
        return context.httpRequest[method](url, data, { headers, ...options });
    },

    sdk: function(context) {

        const apiKey = module.exports.apiKey(context);
        return new OpenAI({
            baseURL: module.exports.baseUrl(context),
            apiKey,
            // The v1 API accepts the key both as a bearer token (what the SDK sends) and in the
            // 'api-key' header that the Azure docs use. Send both so either check passes.
            defaultHeaders: { 'api-key': apiKey }
        });
    },

    formatBytes: function(bytes, decimals = 2) {

        if (!+bytes) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
};
