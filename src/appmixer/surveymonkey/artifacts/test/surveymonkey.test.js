'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');

const ROOT = path.join(__dirname, '..', '..');
const lib = require(path.join(ROOT, 'lib.js'));
const auth = require(path.join(ROOT, 'auth.js'));
const NewResponse = require(path.join(ROOT, 'core', 'NewResponse', 'NewResponse.js'));
const MakeApiCall = require(path.join(ROOT, 'core', 'MakeApiCall', 'MakeApiCall.js'));

class CancelError extends Error {}

const createContext = (overrides = {}) => {

    const cache = new Map();
    const state = overrides.state || {};
    return {
        CancelError,
        auth: { accessToken: 'token-123', profileInfo: { accessUrl: 'https://api.surveymonkey.com' } },
        componentId: 'component-1',
        config: {},
        properties: {},
        messages: {},
        httpRequest: sinon.stub().resolves({ status: 200, headers: {}, data: {} }),
        sendJson: sinon.stub().resolves(),
        response: sinon.stub().returns('response'),
        log: sinon.stub().resolves(),
        getWebhookUrl: () => 'https://appmixer.example.com/flows/1/components/component-1',
        saveState: sinon.stub().callsFake(async (value) => Object.assign(state, value)),
        loadState: sinon.stub().callsFake(async () => state),
        staticCache: {
            get: async (key) => cache.get(key),
            set: async (key, value) => cache.set(key, value)
        },
        lock: async () => ({ unlock: async () => {} }),
        ...overrides
    };
};

describe('surveymonkey lib', () => {

    describe('trustedOrigin', () => {

        it('accepts the US, EU and Canadian API hosts', () => {
            assert.strictEqual(lib.trustedOrigin('https://api.surveymonkey.com'), 'https://api.surveymonkey.com');
            assert.strictEqual(lib.trustedOrigin('https://api.eu.surveymonkey.com/'), 'https://api.eu.surveymonkey.com');
            assert.strictEqual(lib.trustedOrigin('https://api.surveymonkey.ca'), 'https://api.surveymonkey.ca');
        });

        it('rejects other hosts, plain http and credentials', () => {
            assert.strictEqual(lib.trustedOrigin('https://api.surveymonkey.com.evil.example'), null);
            assert.strictEqual(lib.trustedOrigin('http://api.surveymonkey.com'), null);
            assert.strictEqual(lib.trustedOrigin('https://user:pass@api.surveymonkey.com'), null);
            assert.strictEqual(lib.trustedOrigin('not a url'), null);
            assert.strictEqual(lib.trustedOrigin(undefined), null);
        });
    });

    describe('request', () => {

        it('calls the API host of the account with the bearer token', async () => {
            const context = createContext({ auth: { accessToken: 't', profileInfo: { accessUrl: 'https://api.eu.surveymonkey.com' } } });
            context.httpRequest.resolves({ data: { id: '1' } });
            const body = await lib.request(context, { path: '/surveys/1' });
            assert.deepStrictEqual(body, { id: '1' });
            const options = context.httpRequest.firstCall.args[0];
            assert.strictEqual(options.url, 'https://api.eu.surveymonkey.com/v3/surveys/1');
            assert.strictEqual(options.headers.Authorization, 'bearer t');
        });

        it('refuses an account whose stored host is not a SurveyMonkey API host', async () => {
            const context = createContext({ auth: { accessToken: 't', profileInfo: { accessUrl: 'https://evil.example' } } });
            await assert.rejects(lib.request(context, { path: '/surveys' }), /unsupported API host/);
            sinon.assert.notCalled(context.httpRequest);
        });

        it('turns a 403 into a CancelError with the SurveyMonkey message', async () => {
            const context = createContext();
            const error = new Error('Request failed');
            error.response = { status: 403, data: { error: { id: '1014', message: 'Permission has not been granted by the user.' } } };
            context.httpRequest.rejects(error);
            await assert.rejects(lib.request(context, { path: '/surveys' }), (err) => {
                assert.ok(err instanceof CancelError);
                assert.match(err.message, /HTTP 403, error 1014\): Permission has not been granted/);
                return true;
            });
        });

        it('keeps 429 and 5xx retryable', async () => {
            const context = createContext();
            const error = new Error('Too many');
            error.response = { status: 429, data: {} };
            context.httpRequest.rejects(error);
            await assert.rejects(lib.request(context, { path: '/surveys' }), (err) => !(err instanceof CancelError));
        });
    });

    describe('findAccountOrigin', () => {

        it('tries the next data center when a host refuses the token', async () => {
            const context = createContext({ auth: undefined, accessToken: 't' });
            const refused = new Error('wrong data center');
            refused.response = { status: 403, data: { error: { id: '1018' } } };
            context.httpRequest.onFirstCall().rejects(refused);
            context.httpRequest.onSecondCall().resolves({ data: { id: 'u1' } });
            const { origin, user } = await lib.findAccountOrigin(context);
            assert.strictEqual(origin, 'https://api.eu.surveymonkey.com');
            assert.strictEqual(user.id, 'u1');
        });

        it('does not try other hosts on a server error', async () => {
            const context = createContext({ auth: undefined, accessToken: 't' });
            const error = new Error('down');
            error.response = { status: 500, data: {} };
            context.httpRequest.rejects(error);
            await assert.rejects(lib.findAccountOrigin(context));
            sinon.assert.calledOnce(context.httpRequest);
        });
    });

    describe('resolveApiUrl', () => {

        it('resolves a relative path against the account host', () => {
            const context = createContext();
            assert.strictEqual(lib.resolveApiUrl(context, '/v3/surveys'), 'https://api.surveymonkey.com/v3/surveys');
            assert.strictEqual(lib.resolveApiUrl(context, 'v3/users/me'), 'https://api.surveymonkey.com/v3/users/me');
        });

        it('pins EU accounts to the EU host', () => {
            const context = createContext({ auth: { accessToken: 't', profileInfo: { accessUrl: 'https://api.eu.surveymonkey.com' } } });
            assert.strictEqual(lib.resolveApiUrl(context, 'https://api.eu.surveymonkey.com/v3/surveys'), 'https://api.eu.surveymonkey.com/v3/surveys');
            assert.throws(() => lib.resolveApiUrl(context, 'https://api.surveymonkey.com/v3/surveys'), CancelError);
        });

        it('rejects other hosts, protocol-relative URLs and credentials', () => {
            const context = createContext();
            assert.throws(() => lib.resolveApiUrl(context, 'https://evil.example/v3/surveys'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, '//evil.example/v3'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, 'https://a:b@api.surveymonkey.com/v3'), CancelError);
        });
    });

    describe('webhooks', () => {

        it('accepts only the registered secret', () => {
            assert.strictEqual(lib.isAuthorizedWebhook({ authorization: 'abc' }, 'abc'), true);
            assert.strictEqual(lib.isAuthorizedWebhook({ authorization: 'Bearer abc' }, 'abc'), true);
            assert.strictEqual(lib.isAuthorizedWebhook({ authorization: 'abd' }, 'abc'), false);
            assert.strictEqual(lib.isAuthorizedWebhook({}, 'abc'), false);
            assert.strictEqual(lib.isAuthorizedWebhook({ authorization: 'abc' }, undefined), false);
        });

        it('registers the webhook with a random secret and stores it', async () => {
            const context = createContext();
            context.httpRequest.resolves({ data: { id: 'wh1' } });
            await lib.startWebhook(context, { name: 'n', eventType: 'response_completed', objectType: 'survey', objectIds: ['42'] });
            const { data } = context.httpRequest.firstCall.args[0];
            assert.strictEqual(data.event_type, 'response_completed');
            assert.deepStrictEqual(data.object_ids, ['42']);
            assert.strictEqual(data.subscription_url, context.getWebhookUrl());
            assert.match(data.authorization, /^[0-9a-f]{64}$/);
            const state = await context.loadState();
            assert.strictEqual(state.webhookId, 'wh1');
            assert.strictEqual(state.secret, data.authorization);
        });

        it('ignores a 404 when deleting the webhook', async () => {
            const context = createContext({ state: { webhookId: 'wh1' } });
            const error = new Error('gone');
            error.response = { status: 404, data: {} };
            context.httpRequest.rejects(error);
            await lib.stopWebhook(context);
        });

        it('reads an authorized event once', async () => {
            const context = createContext({ state: { secret: 's3cret' } });
            const event = { event_id: 'e1', event_type: 'response_completed', object_id: 'r1' };
            context.messages.webhook = { content: { method: 'POST', headers: { authorization: 's3cret' }, data: event } };
            assert.deepStrictEqual(await lib.readWebhookEvent(context, 'response_completed'), event);
            assert.strictEqual(await lib.readWebhookEvent(context, 'response_completed'), null);
        });

        it('ignores the HEAD check, wrong secrets and other event types', async () => {
            const context = createContext({ state: { secret: 's3cret' } });
            context.messages.webhook = { content: { method: 'HEAD', headers: {}, data: {} } };
            assert.strictEqual(await lib.readWebhookEvent(context, 'response_completed'), null);
            context.messages.webhook = { content: { method: 'POST', headers: { authorization: 'nope' }, data: { event_type: 'response_completed' } } };
            assert.strictEqual(await lib.readWebhookEvent(context, 'response_completed'), null);
            context.messages.webhook = { content: { method: 'POST', headers: { authorization: 's3cret' }, data: { event_type: 'response_created' } } };
            assert.strictEqual(await lib.readWebhookEvent(context, 'response_completed'), null);
        });
    });

    describe('toCsv', () => {

        it('quotes cells and keeps columns aligned', () => {
            const csv = lib.toCsv([{ a: 'x,y', b: 'say "hi"' }, { b: 2, a: null }]);
            assert.strictEqual(csv, 'a,b\n"x,y","say ""hi"""\n,2');
            assert.strictEqual(lib.toCsv([]), '');
        });
    });
});

describe('surveymonkey auth', () => {

    it('builds the authorization URL', () => {
        const url = new URL(auth.definition.authUrl({ clientId: 'cid', callbackUrl: 'https://cb.example/x', ticket: 't1' }));
        assert.strictEqual(url.origin + url.pathname, 'https://api.surveymonkey.com/oauth/authorize');
        assert.strictEqual(url.searchParams.get('client_id'), 'cid');
        assert.strictEqual(url.searchParams.get('state'), 't1');
        assert.strictEqual(url.searchParams.get('response_type'), 'code');
    });

    it('stores the access_url of the token exchange in the profile', async () => {
        const context = createContext({ auth: undefined, clientId: 'c', clientSecret: 's', authorizationCode: 'code', callbackUrl: 'https://cb' });
        context.httpRequest.onFirstCall().resolves({ data: { access_token: 'tok-eu', access_url: 'https://api.eu.surveymonkey.com', token_type: 'bearer' } });
        context.httpRequest.onSecondCall().resolves({ data: { id: 'u1', username: 'jane', email: 'jane@example.com' } });
        const tokens = await auth.definition.requestAccessToken(context);
        assert.deepStrictEqual(tokens, { accessToken: 'tok-eu' });
        const profile = await auth.definition.requestProfileInfo({ ...context, accessToken: 'tok-eu' });
        assert.strictEqual(profile.accessUrl, 'https://api.eu.surveymonkey.com');
        assert.strictEqual(context.httpRequest.secondCall.args[0].url, 'https://api.eu.surveymonkey.com/v3/users/me');
    });

    it('rejects an access_url that is not a SurveyMonkey API host', async () => {
        const context = createContext({ auth: undefined, clientId: 'c', clientSecret: 's', authorizationCode: 'code', callbackUrl: 'https://cb' });
        context.httpRequest.resolves({ data: { access_token: 'tok', access_url: 'https://evil.example' } });
        await assert.rejects(auth.definition.requestAccessToken(context), /unsupported API host/);
    });
});

describe('surveymonkey NewResponse', () => {

    it('emits the response re-read from the API for the watched survey only', async () => {
        const context = createContext({ state: { secret: 's' }, properties: { surveyId: '42' } });
        context.httpRequest.resolves({ data: { id: 'r1', survey_id: '42', pages: [] } });

        context.messages.webhook = { content: { method: 'POST', headers: { authorization: 's' }, data: { event_id: 'e1', event_type: 'response_completed', object_id: 'r1', resources: { survey_id: '99' } } } };
        await NewResponse.receive(context);
        sinon.assert.notCalled(context.sendJson);

        context.messages.webhook = { content: { method: 'POST', headers: { authorization: 's' }, data: { event_id: 'e2', event_type: 'response_completed', object_id: 'r1', resources: { survey_id: '42' } } } };
        await NewResponse.receive(context);
        sinon.assert.calledOnceWithExactly(context.sendJson, { id: 'r1', survey_id: '42', pages: [] }, 'out');
        assert.strictEqual(context.httpRequest.firstCall.args[0].url, 'https://api.surveymonkey.com/v3/surveys/42/responses/r1/details');
    });
});

describe('surveymonkey MakeApiCall', () => {

    it('does not send the token to another host', async () => {
        const context = createContext();
        context.messages.in = { content: { url: 'https://evil.example/steal', method: 'GET' } };
        await assert.rejects(MakeApiCall.receive(context), CancelError);
        sinon.assert.notCalled(context.httpRequest);
    });

    it('sends the authorization header over caller supplied headers', async () => {
        const context = createContext();
        context.messages.in = { content: { url: '/v3/surveys', method: 'GET', headers: JSON.stringify({ Authorization: 'x', 'X-Test': '1' }) } };
        await MakeApiCall.receive(context);
        const options = context.httpRequest.firstCall.args[0];
        assert.strictEqual(options.headers.Authorization, 'bearer token-123');
        assert.strictEqual(options.headers['X-Test'], '1');
    });
});
