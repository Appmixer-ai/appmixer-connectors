'use strict';

const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const sinon = require('sinon');
const { createMockContext } = require('../../utils');

const mcpAuth = require(path.join(__dirname, '../../../src/appmixer/ai/mcptools/mcp-auth.js'));

const SECRET = 'test-jwt-secret';
const BASE_URL = 'https://api.example.appmixer.cloud';
const RESOURCE = `${BASE_URL}/plugins/appmixer/ai/mcptools/mcp`;

const base64url = (input) => Buffer.from(input).toString('base64url');

/**
 * Sign an HS256 JWT with nothing but core crypto. `jsonwebtoken` is a dependency
 * of the mcptools module, not of the repo root, so it does not resolve from the
 * test directory — and the tests should not care which library signed the token.
 */
function sign(payload, secret = SECRET) {

    const data = `${base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}`
        + `.${base64url(JSON.stringify(payload))}`;
    const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${signature}`;
}

const secondsFromNow = (offset) => Math.floor(Date.now() / 1000) + offset;

describe('ai.mcptools mcp-auth', function() {

    let context;

    beforeEach(function() {
        context = createMockContext();
        context.config = { MCP_PUBLIC_BASE_URL: BASE_URL };
        context.db.coreCollection = sinon.stub().returns({
            findOne: sinon.stub().resolves({ type: 'JWTSecret', value: SECRET })
        });
    });

    const requestWith = (token, headers = {}) => ({
        headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }
    });

    describe('resource identity', function() {

        it('builds the canonical resource URI from configuration', function() {
            assert.strictEqual(mcpAuth.getResourceUri(context, requestWith()), RESOURCE);
        });

        it('strips a trailing slash off the configured base URL', function() {
            context.config.MCP_PUBLIC_BASE_URL = `${BASE_URL}/`;
            assert.strictEqual(mcpAuth.getResourceUri(context, requestWith()), RESOURCE);
        });

        it('prefers configuration over attacker-controlled forwarding headers', function() {
            const request = requestWith(null, { 'x-forwarded-host': 'evil.example.com' });
            assert.strictEqual(mcpAuth.getResourceUri(context, request), RESOURCE);
        });

        describe('with nothing configured', function() {

            let apiUrl;

            beforeEach(function() {
                delete context.config.MCP_PUBLIC_BASE_URL;
                apiUrl = process.env.APPMIXER_API_URL;
                delete process.env.APPMIXER_API_URL;
            });

            afterEach(function() {
                // Other suites share this process; put the env back exactly as found.
                if (apiUrl === undefined) {
                    delete process.env.APPMIXER_API_URL;
                } else {
                    process.env.APPMIXER_API_URL = apiUrl;
                }
            });

            it('falls back to the request headers', function() {
                const request = requestWith(null, { host: 'host.example.com', 'x-forwarded-proto': 'https' });

                assert.strictEqual(
                    mcpAuth.getResourceUri(context, request),
                    'https://host.example.com/plugins/appmixer/ai/mcptools/mcp');
            });
        });
    });

    describe('protected resource metadata', function() {

        it('publishes the resource and its authorization server', function() {
            const metadata = mcpAuth.getProtectedResourceMetadata(context, requestWith());

            assert.strictEqual(metadata.resource, RESOURCE);
            assert.deepStrictEqual(metadata.authorization_servers, [BASE_URL]);
            assert.deepStrictEqual(metadata.bearer_methods_supported, ['header']);
        });

        it('does not advertise scopes it cannot enforce', function() {
            const metadata = mcpAuth.getProtectedResourceMetadata(context, requestWith());
            assert.strictEqual('scopes_supported' in metadata, false);
        });

        it('honours a comma-separated authorization server override', function() {
            context.config.MCP_AUTHORIZATION_SERVER = 'https://auth.one/, https://auth.two';
            const metadata = mcpAuth.getProtectedResourceMetadata(context, requestWith());

            assert.deepStrictEqual(metadata.authorization_servers, ['https://auth.one', 'https://auth.two']);
        });
    });

    describe('buildChallenge', function() {

        it('points the client at the metadata document', function() {
            const challenge = mcpAuth.buildChallenge(context, requestWith(), {
                code: 'invalid_token',
                description: 'Missing bearer token.'
            });

            assert.match(challenge, /^Bearer realm="Appmixer MCP"/);
            assert.ok(challenge.includes(
                `resource_metadata="${BASE_URL}/plugins/appmixer/ai/mcptools/.well-known/oauth-protected-resource"`));
            assert.ok(challenge.includes('error="invalid_token"'));
        });

        it('keeps the header parseable when the description contains quotes', function() {
            const challenge = mcpAuth.buildChallenge(context, requestWith(), {
                code: 'invalid_token',
                description: 'bad "quoted" \\ value\nsecond line'
            });

            // Exactly the two quotes each of realm=, resource_metadata=, error= and
            // error_description= — none leaked in from the description.
            assert.strictEqual((challenge.match(/"/g) || []).length, 8);
            assert.strictEqual(challenge.includes('\n'), false);
        });
    });

    describe('extractBearerToken', function() {

        it('reads the Authorization header', function() {
            assert.strictEqual(mcpAuth.extractBearerToken(requestWith('abc')), 'abc');
        });

        it('is case-insensitive about the scheme', function() {
            assert.strictEqual(
                mcpAuth.extractBearerToken({ headers: { authorization: 'bearer abc' } }), 'abc');
        });

        it('ignores a token in the query string', function() {
            assert.strictEqual(mcpAuth.extractBearerToken({ headers: {}, query: { token: 'abc' } }), null);
        });

        it('ignores a non-bearer scheme', function() {
            assert.strictEqual(mcpAuth.extractBearerToken({ headers: { authorization: 'Basic abc' } }), null);
        });
    });

    describe('authenticate', function() {

        it('resolves the user from a valid token', async function() {
            const { userId } = await mcpAuth.authenticate(context, requestWith(sign({ sub: 'user-1' })));
            assert.strictEqual(userId, 'user-1');
        });

        it('rejects a missing token', async function() {
            await assert.rejects(
                () => mcpAuth.authenticate(context, requestWith()),
                (err) => err.name === 'AuthError' && err.status === 401);
        });

        it('rejects a token signed with the wrong secret', async function() {
            await assert.rejects(
                () => mcpAuth.authenticate(context, requestWith(sign({ sub: 'user-1' }, 'other-secret'))),
                /Invalid or expired token/);
        });

        it('rejects an expired token', async function() {
            const token = sign({ sub: 'user-1', exp: secondsFromNow(-60) });
            await assert.rejects(() => mcpAuth.authenticate(context, requestWith(token)), /Invalid or expired/);
        });

        it('rejects a token without a subject', async function() {
            await assert.rejects(
                () => mcpAuth.authenticate(context, requestWith(sign({ foo: 'bar' }))),
                /no subject/);
        });

        it('accepts a token whose audience is this endpoint', async function() {
            const { userId } = await mcpAuth.authenticate(
                context, requestWith(sign({ sub: 'user-1', aud: RESOURCE })));
            assert.strictEqual(userId, 'user-1');
        });

        it('accepts a token whose audience is the bare origin', async function() {
            const { userId } = await mcpAuth.authenticate(
                context, requestWith(sign({ sub: 'user-1', aud: [BASE_URL] })));
            assert.strictEqual(userId, 'user-1');
        });

        it('rejects a token issued for a different resource', async function() {
            const token = sign({ sub: 'user-1', aud: 'https://someone-else.example.com/mcp' });
            await assert.rejects(
                () => mcpAuth.authenticate(context, requestWith(token)),
                /audience does not include/);
        });

        it('accepts an audience-less legacy token by default', async function() {
            const { userId } = await mcpAuth.authenticate(context, requestWith(sign({ sub: 'user-1' })));
            assert.strictEqual(userId, 'user-1');
        });

        it('rejects an audience-less token once MCP_REQUIRE_TOKEN_AUDIENCE is set', async function() {
            context.config.MCP_REQUIRE_TOKEN_AUDIENCE = true;
            await assert.rejects(
                () => mcpAuth.authenticate(context, requestWith(sign({ sub: 'user-1' }))),
                /not bound to/);
        });

        it('surfaces a missing JWT secret as a server error', async function() {
            context.db.coreCollection = sinon.stub().returns({ findOne: sinon.stub().resolves(null) });

            await assert.rejects(
                () => mcpAuth.authenticate(context, requestWith(sign({ sub: 'user-1' }))),
                (err) => err.name === 'AuthError' && err.status === 500);
        });
    });
});
