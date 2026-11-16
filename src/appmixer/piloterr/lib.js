'use strict';

const API_BASE_URL = 'https://api.piloterr.com';
const REQUEST_TIMEOUT_MS = 120000;

module.exports = {

    API_BASE_URL,

    /**
     * Headers that authenticate a request with the account's API key.
     * @param {object} context Appmixer component context (needs `auth.apiKey`)
     * @returns {object}
     */
    authHeaders(context) {

        return { 'x-api-key': context.auth.apiKey };
    },

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against the
     * Piloterr API base and refuse anything that would send the API key elsewhere.
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string} url relative path (e.g. '/v2/usage') or absolute Piloterr API URL
     * @returns {string} absolute URL on the Piloterr API host
     */
    resolveApiUrl(context, url) {

        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')
            ? url
            : `${url.startsWith('/') ? '' : '/'}${url}`;

        let parsed;
        try {
            parsed = new URL(candidate, API_BASE_URL);
        } catch (error) {
            throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
        }

        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== API_BASE_URL) {
            throw new context.CancelError(
                `API Endpoint Path must target ${API_BASE_URL}, got ${parsed.origin}.`
            );
        }

        return parsed.toString();
    },

    /**
     * Call the Piloterr API with the account's key and return the parsed body.
     * context.httpRequest throws on non-2xx responses. An error body
     * {"error": "message"} has its message put on the error.
     * @param {object} args
     * @param {object} args.context Appmixer component context (needs `auth.apiKey`)
     * @param {string} args.path API path starting with a slash
     * @param {object} [args.params] query string parameters; empty values are dropped
     * @returns {Promise<*>} the parsed response body
     */
    async makeRequest({ context, path, params = {} }) {

        const query = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') query[key] = value;
        }

        const options = {
            method: 'GET',
            url: API_BASE_URL + path,
            headers: { ...this.authHeaders(context), 'Accept': 'application/json' },
            params: query,
            timeout: REQUEST_TIMEOUT_MS
        };

        try {
            const response = await context.httpRequest(options);
            return response ? response.data : null;
        } catch (err) {
            const error = err.response && err.response.data && err.response.data.error;
            const message = error && typeof error === 'object' ? error.message : error;
            if (typeof message === 'string' && message) {
                err.message = `Piloterr: ${message}`;
            }
            throw err;
        }
    }
};

