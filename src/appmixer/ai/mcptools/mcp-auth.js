'use strict';

/**
 * mcp-auth.js — OAuth 2.1 *resource server* half of the remote MCP endpoint.
 *
 * The MCP authorization spec splits the work in two. The authorization server
 * (issuing tokens, /authorize, /token, dynamic client registration) is the
 * platform's job and is deliberately NOT implemented here. What an MCP server
 * itself MUST do is:
 *
 *   - publish Protected Resource Metadata (RFC 9728) naming its authorization
 *     server(s),
 *   - answer an unauthenticated call with 401 + a `WWW-Authenticate` header that
 *     points at that metadata document (RFC 9728 §5.1),
 *   - validate the bearer token and, critically, validate that the token was
 *     issued *for this resource* (RFC 8707 audience binding).
 *
 * That is exactly what this module does. Tokens are today's Appmixer JWTs,
 * verified against the same core JWTSecret the /events SSE route already uses.
 *
 * Audience binding: Appmixer access tokens currently carry no `aud` claim. A
 * token that *does* carry one is always checked against our canonical resource
 * URI; a token without one is accepted only while
 * `MCP_REQUIRE_TOKEN_AUDIENCE` is off. Turn that config on once the
 * authorization server starts issuing resource-bound tokens and the endpoint
 * becomes strictly spec-compliant with no code change.
 */

const jwt = require('jsonwebtoken');

// Plugin routes are mounted under this prefix by the platform, so the canonical
// resource URI of the MCP endpoint is <base>/plugins/appmixer/ai/mcptools/mcp.
const PLUGIN_PREFIX = '/plugins/appmixer/ai/mcptools';
const MCP_ENDPOINT_PATH = `${PLUGIN_PREFIX}/mcp`;
const METADATA_PATH = `${PLUGIN_PREFIX}/.well-known/oauth-protected-resource`;

const REALM = 'Appmixer MCP';

class AuthError extends Error {

    constructor(message, { status = 401, code = 'invalid_token' } = {}) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
        this.code = code;
    }
}

function stripTrailingSlash(url) {
    return typeof url === 'string' ? url.replace(/\/+$/, '') : url;
}

/**
 * Absolute base URL this endpoint is reachable at. Explicit configuration wins:
 * the request headers are attacker-controlled and the value ends up inside the
 * metadata document and the 401 challenge, so they are only a last resort for
 * deployments that set neither config nor APPMIXER_API_URL.
 */
function resolveBaseUrl(context, request) {

    const configured = context.config?.MCP_PUBLIC_BASE_URL || process.env.APPMIXER_API_URL;
    if (configured) {
        return stripTrailingSlash(configured);
    }

    const headers = request?.headers || {};
    const proto = headers['x-forwarded-proto'] || request?.server?.info?.protocol || 'https';
    const host = headers['x-forwarded-host'] || headers.host;
    return host ? `${proto}://${host}` : '';
}

function getResourceUri(context, request) {
    return `${resolveBaseUrl(context, request)}${MCP_ENDPOINT_PATH}`;
}

function getMetadataUrl(context, request) {
    return `${resolveBaseUrl(context, request)}${METADATA_PATH}`;
}

/**
 * The authorization server that issues tokens for this resource. Defaults to the
 * Appmixer tenant itself, which is what mints the JWTs we verify below.
 */
function getAuthorizationServers(context, request) {

    const configured = context.config?.MCP_AUTHORIZATION_SERVER;
    if (configured) {
        const servers = Array.isArray(configured) ? configured : String(configured).split(',');
        return servers.map(server => stripTrailingSlash(server.trim())).filter(Boolean);
    }
    return [resolveBaseUrl(context, request)].filter(Boolean);
}

/**
 * RFC 9728 Protected Resource Metadata. `scopes_supported` is deliberately
 * omitted rather than invented — Appmixer tokens carry no MCP-specific scopes
 * yet, and advertising ones we do not enforce would be worse than silence.
 */
function getProtectedResourceMetadata(context, request) {

    return {
        resource: getResourceUri(context, request),
        authorization_servers: getAuthorizationServers(context, request),
        bearer_methods_supported: ['header'],
        resource_name: REALM,
        resource_documentation: 'https://docs.appmixer.com/appmixer/tutorials/appmixer-mcp-server'
    };
}

/** Escape a value for an RFC 7235 quoted-string. */
function quote(value) {
    return String(value).replace(/[\\"]/g, '').replace(/[\r\n]+/g, ' ');
}

/**
 * RFC 9728 §5.1: the 401 must tell the client where the metadata lives. Clients
 * use this URL directly, which is what makes a plugin-prefixed metadata path
 * workable even though it does not sit at the origin root.
 */
function buildChallenge(context, request, { code, description } = {}) {

    const parts = [
        `Bearer realm="${REALM}"`,
        `resource_metadata="${quote(getMetadataUrl(context, request))}"`
    ];
    if (code) {
        parts.push(`error="${quote(code)}"`);
    }
    if (description) {
        parts.push(`error_description="${quote(description)}"`);
    }
    return parts.join(', ');
}

function extractBearerToken(request) {

    // OAuth 2.1 / MCP: the token goes in the Authorization header and MUST NOT be
    // accepted from the query string.
    const header = request?.headers?.authorization;
    if (!header) {
        return null;
    }
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    return match ? match[1].trim() : null;
}

async function getJwtSecret(context) {

    const secret = await context.db.coreCollection('config').findOne({ type: 'JWTSecret' });
    if (!secret?.value) {
        throw new AuthError('JWT secret is not configured.', { status: 500, code: 'server_error' });
    }
    return secret.value;
}

function audienceMatches(claim, resourceUri) {

    // Accept the endpoint URI itself and the bare origin: RFC 8707 lets a client
    // send either as the canonical resource identifier, and clients differ.
    const endpoint = stripTrailingSlash(resourceUri).toLowerCase();
    const origin = stripTrailingSlash(endpoint.slice(0, endpoint.length - MCP_ENDPOINT_PATH.length));
    const accepted = new Set([endpoint, origin].filter(Boolean));

    const audiences = Array.isArray(claim) ? claim : [claim];
    return audiences.some(audience => accepted.has(stripTrailingSlash(String(audience || '')).toLowerCase()));
}

/**
 * Verify the bearer token and resolve the Appmixer user it belongs to.
 *
 * @returns {Promise<{ userId: string, token: object }>}
 * @throws {AuthError} always safe to turn into a 401/403 with buildChallenge().
 */
async function authenticate(context, request) {

    const token = extractBearerToken(request);
    if (!token) {
        throw new AuthError('Missing bearer token.');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, await getJwtSecret(context));
    } catch (err) {
        if (err instanceof AuthError) {
            throw err;
        }
        throw new AuthError(`Invalid or expired token: ${err.message}`);
    }

    if (!decoded?.sub) {
        throw new AuthError('Token has no subject.');
    }

    const resourceUri = getResourceUri(context, request);
    if (decoded.aud !== undefined && decoded.aud !== null) {
        if (!audienceMatches(decoded.aud, resourceUri)) {
            throw new AuthError(`Token audience does not include ${resourceUri}.`);
        }
    } else if (context.config?.MCP_REQUIRE_TOKEN_AUDIENCE) {
        throw new AuthError(`Token is not bound to ${resourceUri}.`);
    }

    return { userId: decoded.sub, token: decoded };
}

module.exports = {
    AuthError,
    MCP_ENDPOINT_PATH,
    METADATA_PATH,
    PLUGIN_PREFIX,
    authenticate,
    buildChallenge,
    extractBearerToken,
    getAuthorizationServers,
    getMetadataUrl,
    getProtectedResourceMetadata,
    getResourceUri,
    resolveBaseUrl
};
