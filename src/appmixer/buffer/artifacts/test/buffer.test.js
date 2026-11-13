'use strict';

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const sinon = require('sinon');

const ROOT = path.join(__dirname, '../..');
const lib = require(path.join(ROOT, 'lib.js'));
const auth = require(path.join(ROOT, 'auth.js'));
const load = (name) => require(path.join(ROOT, 'core', name, `${name}.js`));

class CancelError extends Error {}

const createContext = (overrides = {}) => {

    let state = overrides.state;
    const sent = [];
    const context = {
        auth: { accessToken: 'token-1' },
        config: {},
        properties: {},
        messages: { in: { content: {} } },
        CancelError,
        httpRequest: sinon.stub(),
        sendJson: sinon.stub().callsFake(async (data, port) => sent.push({ data, port })),
        loadState: async () => state,
        saveState: async (value) => {
            state = value;
        },
        log: async () => {},
        ...overrides
    };
    context.sent = sent;
    context.getState = () => state;
    return context;
};

const graphqlReply = (data) => ({ status: 200, data: { data } });

const post = (id, fields = {}) => ({
    id,
    text: `Post ${id}`,
    status: 'scheduled',
    channelId: 'ch1',
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    assets: [],
    error: null,
    ...fields
});

const postsReply = (posts, hasNextPage = false) => graphqlReply({
    posts: {
        edges: posts.map(node => ({ node })),
        pageInfo: { hasNextPage, endCursor: hasNextPage ? 'cursor' : null }
    }
});

describe('appmixer.buffer', function() {

    afterEach(() => sinon.restore());

    describe('auth.js', function() {

        const authContext = () => ({
            clientId: 'client-1',
            clientSecret: 'secret-1',
            ticket: 'ticket-1',
            callbackUrl: 'https://appmixer.example.com/auth/callback',
            authorizationCode: 'code-1',
            scope: auth.definition.scope,
            httpRequest: sinon.stub().resolves({
                data: { access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 3600 }
            })
        });

        it('sends a PKCE S256 challenge that matches the verifier of the token exchange', async function() {

            const context = authContext();
            const url = new URL(auth.definition.authUrl(context));

            assert.strictEqual(url.origin + url.pathname, 'https://auth.buffer.com/auth');
            assert.strictEqual(url.searchParams.get('code_challenge_method'), 'S256');
            assert.strictEqual(url.searchParams.get('state'), 'ticket-1');
            assert.strictEqual(url.searchParams.get('prompt'), 'consent');
            assert(url.searchParams.get('scope').split(' ').includes('offline_access'));

            const tokens = await auth.definition.requestAccessToken(context);
            const body = new URLSearchParams(context.httpRequest.firstCall.args[0].data);
            const verifier = body.get('code_verifier');

            assert(verifier.length >= 43, 'verifier shorter than RFC 7636 allows');
            assert.notStrictEqual(verifier, 'ticket-1');
            assert.strictEqual(
                crypto.createHash('sha256').update(verifier).digest('base64url'),
                url.searchParams.get('code_challenge')
            );
            assert.strictEqual(body.get('grant_type'), 'authorization_code');
            assert.strictEqual(body.get('client_secret'), 'secret-1');
            assert.strictEqual(tokens.accessToken, 'access-2');
            assert.strictEqual(tokens.refreshToken, 'refresh-2');
            assert(tokens.accessTokenExpDate > new Date());
        });

        it('stores the rotated refresh token', async function() {

            const context = { ...authContext(), refreshToken: 'refresh-1' };
            const tokens = await auth.definition.refreshAccessToken(context);
            const body = new URLSearchParams(context.httpRequest.firstCall.args[0].data);

            assert.strictEqual(body.get('grant_type'), 'refresh_token');
            assert.strictEqual(body.get('refresh_token'), 'refresh-1');
            assert.strictEqual(tokens.refreshToken, 'refresh-2');
        });
    });

    describe('lib.graphql', function() {

        it('throws CancelError for a non-recoverable GraphQL error answered with HTTP 200', async function() {

            const context = createContext();
            context.httpRequest.resolves({
                status: 200,
                data: { data: null, errors: [{ message: 'Post not found', extensions: { code: 'NOT_FOUND' } }] }
            });
            await assert.rejects(() => lib.graphql(context, 'query { x }'), (err) => err instanceof CancelError);
        });

        it('throws a retryable error for other GraphQL errors', async function() {

            const context = createContext();
            context.httpRequest.resolves({
                status: 200,
                data: { data: null, errors: [{ message: 'Boom', extensions: { code: 'UNEXPECTED' } }] }
            });
            await assert.rejects(
                () => lib.graphql(context, 'query { x }'),
                (err) => !(err instanceof CancelError) && /UNEXPECTED: Boom/.test(err.message)
            );
        });

        it('posts to the API with the bearer token', async function() {

            const context = createContext();
            context.httpRequest.resolves(graphqlReply({ ok: true }));
            await lib.graphql(context, 'query { x }', { a: 1 });
            const options = context.httpRequest.firstCall.args[0];
            assert.strictEqual(options.url, 'https://api.buffer.com');
            assert.strictEqual(options.method, 'POST');
            assert.strictEqual(options.headers.Authorization, 'Bearer token-1');
            assert.deepStrictEqual(options.data, { query: 'query { x }', variables: { a: 1 } });
        });
    });

    describe('CreatePost', function() {

        it('creates a post with images and returns the mapped post', async function() {

            const context = createContext();
            context.messages.in.content = {
                channelId: 'ch1',
                text: 'Hello',
                mode: 'customScheduled',
                dueAt: '2026-03-10T15:00:00Z',
                imageUrls: 'https://example.com/a.jpg,\nhttps://example.com/b.jpg'
            };
            context.httpRequest.resolves(graphqlReply({
                createPost: { __typename: 'PostActionSuccess', post: post('p1', { error: { message: 'x' } }) }
            }));

            await load('CreatePost').receive(context);

            const { input } = context.httpRequest.firstCall.args[0].data.variables;
            assert.deepStrictEqual(input, {
                channelId: 'ch1',
                text: 'Hello',
                mode: 'customScheduled',
                schedulingType: 'automatic',
                dueAt: '2026-03-10T15:00:00.000Z',
                assets: [{ image: { url: 'https://example.com/a.jpg' } }, { image: { url: 'https://example.com/b.jpg' } }]
            });
            assert.strictEqual(context.sent[0].data.id, 'p1');
            assert.strictEqual(context.sent[0].data.errorMessage, 'x');
        });

        it('turns a MutationError into CancelError', async function() {

            const context = createContext();
            context.messages.in.content = { channelId: 'ch1', text: 'Hello' };
            context.httpRequest.resolves(graphqlReply({
                createPost: { __typename: 'NotFoundError', message: 'Channel not found' }
            }));
            await assert.rejects(
                () => load('CreatePost').receive(context),
                (err) => err instanceof CancelError && /Channel not found/.test(err.message)
            );
        });

        it('requires Due At for Custom Scheduled, before any request', async function() {

            const context = createContext();
            context.messages.in.content = { channelId: 'ch1', text: 'Hello', mode: 'customScheduled' };
            await assert.rejects(() => load('CreatePost').receive(context), CancelError);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });
    });

    describe('UpdatePost', function() {

        it('sends only the fields that were filled in, and reschedules on Due At alone', async function() {

            const context = createContext();
            context.messages.in.content = { postId: 'p1', dueAt: '2026-03-10T15:00:00Z' };
            context.httpRequest.resolves(graphqlReply({ editPost: { __typename: 'PostActionSuccess', post: { id: 'p1' } } }));

            await load('UpdatePost').receive(context);

            const { input } = context.httpRequest.firstCall.args[0].data.variables;
            assert.deepStrictEqual(input, { id: 'p1', dueAt: '2026-03-10T15:00:00.000Z', mode: 'customScheduled' });
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
        });
    });

    describe('FindPosts', function() {

        it('sends to notFound when nothing matches', async function() {

            const context = createContext();
            context.messages.in.content = { organizationId: 'org1', status: 'sent', channelId: 'ch1' };
            context.httpRequest.resolves(postsReply([]));

            await load('FindPosts').receive(context);

            const { input } = context.httpRequest.firstCall.args[0].data.variables;
            assert.deepStrictEqual(input.filter, { channelIds: ['ch1'], status: ['sent'] });
            assert.strictEqual(context.sent[0].port, 'notFound');
        });
    });

    describe('MakeApiCall', function() {

        it('refuses a host other than api.buffer.com without sending the token', async function() {

            const context = createContext();
            context.messages.in.content = { url: 'https://evil.example.com/x', method: 'POST' };
            await assert.rejects(() => load('MakeApiCall').receive(context), CancelError);
            context.messages.in.content = { url: '//evil.example.com/x', method: 'POST' };
            await assert.rejects(() => load('MakeApiCall').receive(context), CancelError);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });
    });

    describe('NewPost trigger', function() {

        const NewPost = load('NewPost');

        it('fires only posts created after the flow started, once', async function() {

            const clock = sinon.useFakeTimers(new Date('2026-01-01T10:00:00.000Z'));
            const context = createContext({ properties: { organizationId: 'org1', pollInterval: '5' } });

            await NewPost.start(context);
            assert.strictEqual(context.getState().since, '2026-01-01T10:00:00.000Z');

            clock.tick(60 * 1000);
            const old = post('old', { createdAt: '2026-01-01T09:59:00.000Z' });
            const fresh = post('new', { createdAt: '2026-01-01T10:00:30.000Z' });
            context.httpRequest.resolves(postsReply([fresh, old]));
            await NewPost.tick(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.id), ['new']);

            const { input } = context.httpRequest.firstCall.args[0].data.variables;
            assert.deepStrictEqual(input.filter, { createdAt: { start: '2026-01-01T10:00:00.000Z' } });
            assert.deepStrictEqual(input.sort, [{ field: 'createdAt', direction: 'desc' }]);

            // Within the polling interval: no request at all.
            clock.tick(60 * 1000);
            await NewPost.tick(context);
            assert.strictEqual(context.httpRequest.callCount, 1);

            // An empty answer keeps the state; the same post does not fire twice afterwards.
            clock.tick(5 * 60 * 1000);
            context.httpRequest.resolves(postsReply([]));
            await NewPost.tick(context);
            clock.tick(5 * 60 * 1000);
            context.httpRequest.resolves(postsReply([fresh]));
            await NewPost.tick(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.id), ['new']);
        });

        it('test() emits the newest post without touching state', async function() {

            const context = createContext({ properties: { organizationId: 'org1', channelId: 'ch1' } });
            context.saveState = sinon.stub();
            context.httpRequest.resolves(postsReply([post('p9')]));

            await NewPost.test(context);

            const { variables } = context.httpRequest.firstCall.args[0].data;
            assert.strictEqual(variables.first, 1);
            assert.deepStrictEqual(variables.input.filter, { channelIds: ['ch1'] });
            assert.strictEqual(context.sent[0].data.id, 'p9');
            assert.strictEqual(context.saveState.callCount, 0);
        });
    });

    describe('PostSent trigger', function() {

        it('fires a post sent after the flow started even when it was due earlier', async function() {

            const clock = sinon.useFakeTimers(new Date('2026-01-01T10:00:00.000Z'));
            const context = createContext({ properties: { organizationId: 'org1' } });
            const PostSent = load('PostSent');

            await PostSent.start(context);
            clock.tick(60 * 1000);
            context.httpRequest.resolves(postsReply([
                post('late', { status: 'sent', dueAt: '2026-01-01T09:00:00.000Z', sentAt: '2026-01-01T10:00:20.000Z' }),
                post('before', { status: 'sent', dueAt: '2026-01-01T09:30:00.000Z', sentAt: '2026-01-01T09:30:02.000Z' })
            ]));
            await PostSent.tick(context);

            const { input } = context.httpRequest.firstCall.args[0].data.variables;
            assert.deepStrictEqual(input.filter, { status: ['sent'], dueAt: { start: '2025-12-31T10:01:00.000Z' } });
            assert.deepStrictEqual(context.sent.map(s => s.data.id), ['late']);
        });
    });
});
