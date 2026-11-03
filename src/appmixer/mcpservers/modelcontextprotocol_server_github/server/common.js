'use strict';

// Port of common/errors.ts, common/utils.ts and common/version.ts of the deprecated
// @modelcontextprotocol/server-github package, plus a small JSON Schema validator that
// stands in for the zod `.parse()` calls of the original (same stripping of unknown keys,
// same issue objects in the "Invalid input: [...]" error text).

const VERSION = '0.6.2';

// ---------------------------------------------------------------------------
// Errors (common/errors.ts)
// ---------------------------------------------------------------------------

class GitHubError extends Error {

    constructor(message, status, response) {

        super(message);
        this.name = 'GitHubError';
        this.status = status;
        this.response = response;
    }
}

class GitHubValidationError extends GitHubError {

    constructor(message, status, response) {

        super(message, status, response);
        this.name = 'GitHubValidationError';
    }
}

class GitHubResourceNotFoundError extends GitHubError {

    constructor(resource) {

        super(`Resource not found: ${resource}`, 404, { message: `${resource} not found` });
        this.name = 'GitHubResourceNotFoundError';
    }
}

class GitHubAuthenticationError extends GitHubError {

    constructor(message = 'Authentication failed') {

        super(message, 401, { message });
        this.name = 'GitHubAuthenticationError';
    }
}

class GitHubPermissionError extends GitHubError {

    constructor(message = 'Insufficient permissions') {

        super(message, 403, { message });
        this.name = 'GitHubPermissionError';
    }
}

class GitHubRateLimitError extends GitHubError {

    constructor(message = 'Rate limit exceeded', resetAt) {

        super(message, 429, { message, reset_at: resetAt.toISOString() });
        this.name = 'GitHubRateLimitError';
        this.resetAt = resetAt;
    }
}

class GitHubConflictError extends GitHubError {

    constructor(message) {

        super(message, 409, { message });
        this.name = 'GitHubConflictError';
    }
}

function isGitHubError(error) {

    return error instanceof GitHubError;
}

function createGitHubError(status, response) {

    switch (status) {
        case 401:
            return new GitHubAuthenticationError(response?.message);
        case 403:
            return new GitHubPermissionError(response?.message);
        case 404:
            return new GitHubResourceNotFoundError(response?.message || 'Resource');
        case 409:
            return new GitHubConflictError(response?.message || 'Conflict occurred');
        case 422:
            return new GitHubValidationError(response?.message || 'Validation failed', status, response);
        case 429:
            return new GitHubRateLimitError(response?.message, new Date(response?.reset_at || Date.now() + 60000));
        default:
            return new GitHubError(response?.message || 'GitHub API error', status, response);
    }
}

// ---------------------------------------------------------------------------
// HTTP (common/utils.ts)
// ---------------------------------------------------------------------------

// Inlined universal-user-agent 7.x getUserAgent().
function getUserAgent() {

    if (typeof navigator === 'object' && 'userAgent' in navigator) {
        return navigator.userAgent;
    }
    if (typeof process === 'object' && process.version !== undefined) {
        return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
    }
    return '<environment undetectable>';
}

const USER_AGENT = `modelcontextprotocol/servers/github/v${VERSION} ${getUserAgent()}`;

async function parseResponseBody(response) {

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

function buildUrl(baseUrl, params) {

    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
            url.searchParams.append(key, value.toString());
        }
    });
    return url.toString();
}

async function githubRequest(url, options = {}) {

    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        ...options.headers
    };

    if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
    }

    const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
        throw createGitHubError(response.status, responseBody);
    }

    return responseBody;
}

// ---------------------------------------------------------------------------
// Schema validation (replacement for zod `.parse()`)
// ---------------------------------------------------------------------------

// Thrown instead of z.ZodError; `errors` carries zod-3-shaped issue objects.
class SchemaValidationError extends Error {

    constructor(issues) {

        super(JSON.stringify(issues, null, 2));
        this.name = 'SchemaValidationError';
        this.issues = issues;
        this.errors = issues;
    }
}

// Same type names as zod's getParsedType().
function getParsedType(data) {

    switch (typeof data) {
        case 'undefined': return 'undefined';
        case 'string': return 'string';
        case 'number': return isNaN(data) ? 'nan' : 'number';
        case 'boolean': return 'boolean';
        case 'function': return 'function';
        case 'bigint': return 'bigint';
        case 'symbol': return 'symbol';
        case 'object':
            if (data === null) return 'null';
            if (Array.isArray(data)) return 'array';
            if (typeof data.then === 'function') return 'promise';
            if (data instanceof Map) return 'map';
            if (data instanceof Set) return 'set';
            if (data instanceof Date) return 'date';
            return 'object';
        default: return 'unknown';
    }
}

function joinValues(values) {

    return values.map(value => typeof value === 'string' ? `'${value}'` : value).join(' | ');
}

function invalidType(expected, received, path) {

    return {
        code: 'invalid_type',
        expected,
        received,
        path,
        message: received === 'undefined' ? 'Required' : `Expected ${expected}, received ${received}`
    };
}

function schemaType(schema) {

    if (Array.isArray(schema.type)) {
        return schema.type.find(type => type !== 'null');
    }
    return schema.type;
}

// `type: ['string', 'null']` (zod-to-json-schema form) or `nullable: true` on object schemas.
function allowsNull(schema) {

    return schema.nullable === true || (Array.isArray(schema.type) && schema.type.includes('null'));
}

// Validates `data` against a (zod-to-json-schema style) JSON Schema, collecting issues and
// returning the output value with unknown object keys stripped.
function check(schema, data, path, issues) {

    const received = getParsedType(data);

    if (schema.anyOf) {
        for (const option of schema.anyOf) {
            const optionIssues = [];
            const result = check(option, data, path, optionIssues);
            if (optionIssues.length === 0) {
                return result;
            }
        }
        const unionErrors = schema.anyOf.map(option => {
            const optionIssues = [];
            check(option, data, path, optionIssues);
            return { issues: optionIssues, name: 'ZodError' };
        });
        issues.push({ code: 'invalid_union', unionErrors, path, message: 'Invalid input' });
        return data;
    }

    if (data === null && allowsNull(schema)) {
        return null;
    }

    if (schema.enum) {
        if (received !== 'string') {
            // zod's enum issue lists `expected` and `received` before `code`.
            const { code, expected, received: got, message } = invalidType(joinValues(schema.enum), received, path);
            issues.push({ expected, received: got, code, path, message });
            return data;
        }
        if (!schema.enum.includes(data)) {
            issues.push({
                received: data,
                code: 'invalid_enum_value',
                options: schema.enum,
                path,
                message: `Invalid enum value. Expected ${joinValues(schema.enum)}, received '${data}'`
            });
        }
        return data;
    }

    const type = schemaType(schema);

    switch (type) {
        case 'string':
        case 'boolean':
            if (received !== type) {
                issues.push(invalidType(type, received, path));
            }
            return data;

        case 'number':
            if (received !== 'number') {
                issues.push(invalidType('number', received, path));
                return data;
            }
            if (schema.minimum !== undefined && data < schema.minimum) {
                issues.push({
                    code: 'too_small',
                    minimum: schema.minimum,
                    type: 'number',
                    inclusive: true,
                    exact: false,
                    message: `Number must be greater than or equal to ${schema.minimum}`,
                    path
                });
            }
            if (schema.maximum !== undefined && data > schema.maximum) {
                issues.push({
                    code: 'too_big',
                    maximum: schema.maximum,
                    type: 'number',
                    inclusive: true,
                    exact: false,
                    message: `Number must be less than or equal to ${schema.maximum}`,
                    path
                });
            }
            return data;

        case 'array':
            if (received !== 'array') {
                issues.push(invalidType('array', received, path));
                return data;
            }
            return data.map((item, index) => check(schema.items, item, path.concat(index), issues));

        case 'object': {
            if (received !== 'object') {
                issues.push(invalidType('object', received, path));
                return data;
            }
            const required = schema.required || [];
            const output = {};
            for (const key of Object.keys(schema.properties || {})) {
                const value = data[key];
                if (value === undefined && !required.includes(key)) {
                    // Optional key: zod keeps it only when it was present in the input.
                    if (key in data) {
                        output[key] = undefined;
                    }
                    continue;
                }
                const result = check(schema.properties[key], value, path.concat(key), issues);
                if (result !== undefined || key in data) {
                    output[key] = result;
                }
            }
            return output;
        }

        default:
            return data;
    }
}

function parse(schema, data) {

    const issues = [];
    const result = check(schema, data, [], issues);
    if (issues.length > 0) {
        throw new SchemaValidationError(issues);
    }
    return result;
}

module.exports = {
    VERSION,
    GitHubError,
    GitHubValidationError,
    GitHubResourceNotFoundError,
    GitHubAuthenticationError,
    GitHubPermissionError,
    GitHubRateLimitError,
    GitHubConflictError,
    isGitHubError,
    createGitHubError,
    buildUrl,
    githubRequest,
    SchemaValidationError,
    parse
};
