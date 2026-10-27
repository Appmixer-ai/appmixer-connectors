'use strict';

const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const routes = require('../../routes');

// Security: listener registrations must be bound to the portal of the registering account.
describe('onListenerAdded portal verification', () => {

    const TOKEN = 'access-token-of-portal-33';
    let context;
    let listenerHandler;
    let originalUrl;
    let originalToken;

    function setAuthHubPod() {
        process.env.AUTH_HUB_URL = 'https://auth-hub.example.com';
        delete process.env.AUTH_HUB_TOKEN;
    }

    beforeEach(async () => {

        originalUrl = process.env.AUTH_HUB_URL;
        originalToken = process.env.AUTH_HUB_TOKEN;
        delete process.env.AUTH_HUB_URL;
        delete process.env.AUTH_HUB_TOKEN;

        context = {
            ...testUtils.createMockContext(),
            http: { router: { register: sinon.stub() } },
            config: { clientSecret: 'secret' }
        };
        await routes(context);
        listenerHandler = context.onListenerAdded.getCall(0).args[0];
    });

    afterEach(() => {

        if (originalUrl === undefined) {
            delete process.env.AUTH_HUB_URL;
        } else {
            process.env.AUTH_HUB_URL = originalUrl;
        }
        if (originalToken === undefined) {
            delete process.env.AUTH_HUB_TOKEN;
        } else {
            process.env.AUTH_HUB_TOKEN = originalToken;
        }
    });

    it('AuthHub: accepts a listener for the token\'s own portal and strips the token, apiKey and appId', async () => {

        setAuthHubPod();
        context.httpRequest.resolves({ data: { hub_id: 33, app_id: 456 } });
        const listener = {
            eventName: 'contact.creation:33',
            params: { accessToken: TOKEN, apiKey: 'dev-key', appId: '456' }
        };

        await listenerHandler(listener);

        assert.equal(context.httpRequest.callCount, 1, 'one token lookup');
        const request = context.httpRequest.getCall(0).args[0];
        assert.equal(request.method, 'GET');
        assert.equal(request.url, `https://api.hubapi.com/oauth/v1/access-tokens/${TOKEN}`);
        assert.deepEqual(listener.params, {}, 'token, apiKey and appId are not stored');
    });

    it('AuthHub: keeps propertyName of ContactPropertyChanged', async () => {

        setAuthHubPod();
        context.httpRequest.resolves({ data: { hub_id: '33' } });
        const listener = {
            eventName: 'contact.propertyChange:33',
            params: { accessToken: TOKEN, propertyName: 'email' }
        };

        await listenerHandler(listener);

        assert.deepEqual(listener.params, { propertyName: 'email' });
    });

    it('AuthHub: rejects a listener that names another portal (403)', async () => {

        setAuthHubPod();
        context.httpRequest.resolves({ data: { hub_id: 33 } });
        const listener = { eventName: 'contact.creation:44', params: { accessToken: TOKEN } };

        await assert.rejects(() => listenerHandler(listener), err => {
            assert.equal(err.statusCode, 403);
            assert(!err.message.includes(TOKEN), 'the token is not in the error');
            return true;
        });
        assert.equal(listener.params.accessToken, undefined, 'token removed even on rejection');
    });

    it('AuthHub: rejects when the token can not be verified, without logging the token', async () => {

        setAuthHubPod();
        const error = new Error(`Request failed: https://api.hubapi.com/oauth/v1/access-tokens/${TOKEN}`);
        error.response = { status: 401 };
        context.httpRequest.rejects(error);

        await assert.rejects(
            () => listenerHandler({ eventName: 'contact.creation:33', params: { accessToken: TOKEN } }),
            err => err.statusCode === 403
        );
        const logged = JSON.stringify(context.log.getCalls().map(call => call.args));
        assert(!logged.includes(TOKEN), 'the token is never logged');
    });

    it('AuthHub: accepts a listener without a token (older connector versions) with a warning', async () => {

        setAuthHubPod();
        const listener = { eventName: 'contact.creation:44', params: { apiKey: 'dev-key', appId: '456' } };

        await listenerHandler(listener);

        assert.equal(context.httpRequest.callCount, 0);
        assert(context.log.getCalls().some(call => call.args[1] === 'hubspot-plugin-listener-added-missing-token'));
        assert.deepEqual(listener.params, {});
    });

    it('AuthHub: rejects a listener without a token when requireListenerAccessToken is set', async () => {

        setAuthHubPod();
        context.config.requireListenerAccessToken = 'true';

        await assert.rejects(
            () => listenerHandler({ eventName: 'contact.creation:44', params: {} }),
            err => err.statusCode === 403
        );
    });

    it('standalone: verifies the token, then creates the subscriptions with apiKey/appId', async () => {

        context.httpRequest.onCall(0).resolves({ data: { hub_id: 33 } });
        context.httpRequest.onCall(1).resolves({ data: { results: [] } });
        context.httpRequest.onCall(2).resolves({ statusCode: 200, data: {} });
        const listener = {
            eventName: 'contact.creation:33',
            params: { accessToken: TOKEN, apiKey: 'dev-key', appId: '456' }
        };

        await listenerHandler(listener);

        assert.equal(context.httpRequest.callCount, 3, 'token lookup + list + create');
        assert(context.httpRequest.getCall(1).args[0].url.includes('/webhooks/v3/456/subscriptions'));
        assert.deepEqual(listener.params, { apiKey: 'dev-key', appId: '456' }, 'only the token is removed');
    });

    it('tenant pod forwarding to the AuthHub leaves the token for the AuthHub', async () => {

        process.env.AUTH_HUB_URL = 'https://auth-hub.example.com';
        process.env.AUTH_HUB_TOKEN = 'tenant-token';
        context.httpRequest.resolves({ data: { results: [{ eventType: 'contact.creation', active: true }] } });
        const listener = {
            eventName: 'contact.creation:33',
            params: { accessToken: TOKEN, apiKey: 'dev-key', appId: '456' }
        };

        await listenerHandler(listener);

        assert.equal(listener.params.accessToken, TOKEN);
        assert(!context.httpRequest.getCalls().some(call => call.args[0].url.includes('/oauth/v1/access-tokens/')));
    });
});
