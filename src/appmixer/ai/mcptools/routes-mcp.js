'use strict';

/**
 * routes-mcp.js — remote MCP endpoint (Streamable HTTP transport).
 *
 *   POST   /plugins/appmixer/ai/mcptools/mcp   JSON-RPC in, JSON-RPC out
 *   GET    /plugins/appmixer/ai/mcptools/mcp   SSE stream of server notifications
 *   DELETE /plugins/appmixer/ai/mcptools/mcp   405 — the endpoint is stateless
 *   GET    /plugins/appmixer/ai/mcptools/.well-known/oauth-protected-resource
 *
 * Connect an MCP client to it with a bearer token:
 *
 *   curl -XPOST -H "Authorization: Bearer ACCESS_TOKEN" \
 *        -H "Accept: application/json, text/event-stream" \
 *        -H "Content-Type: application/json" \
 *        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
 *        "https://APPMIXER_TENANT_API_URL/plugins/appmixer/ai/mcptools/mcp"
 *
 * Routes are registered with `auth: false` on purpose. The platform's
 * jwt-strategy answers a bad token with a bare 401, but an MCP client needs the
 * 401 to carry `WWW-Authenticate: Bearer resource_metadata="..."` — that header
 * is how it discovers the authorization server and starts the OAuth flow. So
 * the bearer token is verified in-handler by mcp-auth.js instead.
 */

const { PassThrough } = require('stream');
const mcpAuth = require('./mcp-auth');
const streamableHttp = require('./streamable-http');

const MCP_PATH = '/mcp';
const METADATA_PATH = '/.well-known/oauth-protected-resource';

// Browser-based MCP clients send Authorization and the MCP header pair, and read
// the challenge back off a 401; neither works without these being allow-listed.
// Built fresh per route — hapi normalizes route options in place, so a shared
// object would be mutated by whichever route is registered first.
const cors = () => ({
    origin: ['*'],
    additionalHeaders: ['authorization', 'mcp-session-id', 'mcp-protocol-version'],
    additionalExposedHeaders: ['mcp-session-id', 'www-authenticate']
});

module.exports = (context) => {

    const unauthorized = (h, request, err) => {
        const status = err.status || 401;
        const response = h.response(status === 401 ? { error: err.code, error_description: err.message } : undefined)
            .code(status);
        if (status === 401) {
            response.header('WWW-Authenticate', mcpAuth.buildChallenge(context, request, {
                code: err.code,
                description: err.message
            }));
        }
        return response;
    };

    /**
     * Reject requests from a browser origin we do not know. The Streamable HTTP
     * spec asks servers to validate `Origin` against DNS-rebinding attacks. The
     * risk is small here (this endpoint is bearer-authenticated, not cookie-
     * authenticated, so a rebound page has no ambient credentials to replay), so
     * the check only applies when an allow-list is actually configured.
     */
    const originRejected = (request) => {

        const allowed = context.config?.MCP_ALLOWED_ORIGINS;
        const origin = request.headers.origin;
        if (!allowed || !origin) {
            return false;
        }
        const list = (Array.isArray(allowed) ? allowed : String(allowed).split(','))
            .map(entry => entry.trim().toLowerCase())
            .filter(Boolean);
        return !list.includes('*') && !list.includes(origin.toLowerCase());
    };

    const protocolVersionRejected = (request) => {
        const version = request.headers['mcp-protocol-version'];
        return Boolean(version) && !streamableHttp.isSupportedProtocolVersion(version);
    };

    // ─── Protected resource metadata (RFC 9728) ──────────────────────────────
    //
    // Served under the plugin prefix, which is the only place a connector plugin
    // can register routes. Clients reach it via the `resource_metadata` URL in the
    // 401 challenge, which RFC 9728 §5.1 makes authoritative. A client that instead
    // guesses the origin-root path needs an ingress rewrite from
    // /.well-known/oauth-protected-resource/plugins/appmixer/ai/mcptools/mcp — see
    // the module README.
    const metadataHandler = async (request, h) => {
        return h.response(mcpAuth.getProtectedResourceMetadata(context, request)).type('application/json');
    };

    for (const path of [METADATA_PATH, `${METADATA_PATH}${MCP_PATH}`]) {
        context.http.router.register({
            method: 'GET',
            path,
            options: {
                auth: false,
                cors: cors(),
                handler: metadataHandler
            }
        });
    }

    // ─── Streamable HTTP: client → server ────────────────────────────────────
    context.http.router.register({
        method: 'POST',
        path: MCP_PATH,
        options: {
            auth: false,
            cors: cors(),
            handler: async (request, h) => {

                if (originRejected(request)) {
                    return h.response({ error: 'Origin not allowed' }).code(403);
                }
                if (protocolVersionRejected(request)) {
                    return h.response(streamableHttp.failure(
                        null,
                        streamableHttp.INVALID_REQUEST,
                        `Unsupported MCP-Protocol-Version: ${request.headers['mcp-protocol-version']}`
                    )).code(400);
                }

                let userId;
                try {
                    ({ userId } = await mcpAuth.authenticate(context, request));
                } catch (err) {
                    return unauthorized(h, request, err);
                }

                // Batching was removed in 2025-06-18 but 2025-03-26 clients may still
                // send an array, so mirror the request shape in the response.
                const payload = request.payload;
                const batched = Array.isArray(payload);
                const messages = batched ? payload : [payload];

                const responses = [];
                for (const message of messages) {
                    const response = await streamableHttp.handleMessage(context, { message, userId });
                    if (response) {
                        responses.push(response);
                    }
                }

                // Nothing to answer means the body held only notifications/responses.
                if (!responses.length) {
                    return h.response().code(202);
                }
                return h.response(batched ? responses : responses[0]).type('application/json').code(200);
            }
        }
    });

    // ─── Streamable HTTP: server → client ────────────────────────────────────
    //
    // The tool list is not static — it is whatever the user's *running* flows
    // expose, so starting or stopping a flow changes it. The gateway routes
    // already publish those changes on stream:mcp:events:<userId>; relaying them
    // as tools/list_changed is what makes the advertised `listChanged: true`
    // capability true.
    context.http.router.register({
        method: 'GET',
        path: MCP_PATH,
        options: {
            auth: false,
            cors: cors(),
            handler: async (request, h) => {

                if (originRejected(request)) {
                    return h.response({ error: 'Origin not allowed' }).code(403);
                }

                let userId;
                try {
                    ({ userId } = await mcpAuth.authenticate(context, request));
                } catch (err) {
                    return unauthorized(h, request, err);
                }

                const stream = new PassThrough();
                const response = h.response(stream);
                response.type('text/event-stream');
                response.header('Cache-Control', 'no-cache');
                response.header('Connection', 'keep-alive');
                // Force raw, uncompressed output to avoid ERR_INCOMPLETE_CHUNKED_ENCODING.
                response.header('Content-Encoding', 'identity');
                stream.write(': init\n\n'); // Kickstart stream.

                const notify = () => {
                    if (!stream.writableEnded) {
                        const message = { jsonrpc: '2.0', method: 'notifications/tools/list_changed' };
                        stream.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
                    }
                };

                // Track the subscription so the close handler can unsubscribe even if
                // the client disconnects while subscribe is still awaiting.
                let sub = null;
                let closed = false;

                const heartbeat = setInterval(() => {
                    if (!stream.writableEnded) {
                        stream.write(': ping\n\n');
                    }
                }, context.config?.SSE_HEARTBEAT_INTERVAL || 15000);

                request.raw.req.on('close', () => {
                    closed = true;
                    clearInterval(heartbeat);
                    Promise.allSettled([
                        sub ? sub.unsubscribe() : Promise.resolve()
                    ]).finally(() => {
                        if (!stream.writableEnded) stream.end();
                    });
                });

                sub = await context.pubSubSubscribe(`stream:mcp:events:${userId}`, notify);

                if (closed) {
                    await sub.unsubscribe();
                    if (!stream.writableEnded) stream.end();
                    return response;
                }

                return response;
            }
        }
    });

    // ─── Session termination ─────────────────────────────────────────────────
    //
    // The endpoint issues no Mcp-Session-Id, so there is no session to delete.
    // 405 is the spec's answer for a server that does not let clients terminate
    // sessions.
    context.http.router.register({
        method: 'DELETE',
        path: MCP_PATH,
        options: {
            auth: false,
            cors: cors(),
            handler: async (request, h) => {
                return h.response().code(405).header('Allow', 'GET, POST');
            }
        }
    });
};
