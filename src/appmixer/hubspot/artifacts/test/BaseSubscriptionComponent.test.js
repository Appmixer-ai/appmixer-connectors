const assert = require('assert');
const testUtils = require('../../../../../test/utils.js');
const sinon = require('sinon');
const Base = require('../../BaseSubscriptionComponent.js');

// Simulates eg UpdatedContact component
class TestComponent extends Base {

    async getSubscriptions() {
        return [];
    }
    // We don't want to call the actual API
    subscribe() {
        return Promise.resolve();
    }
    deleteSubscriptions() {
        return Promise.resolve();
    }
}

describe('BaseSubscriptionComponent', () => {

    let context = testUtils.createMockContext();

    beforeEach(async () => {

        // Reset the context.
        context = testUtils.createMockContext();
        // Set the profile info.
        context.auth.profileInfo = {
            token: 'CJSP5qf1KhICAQEYs-gDIIGOBii1hQIyGQAf3xBKmlwHjX7OIpuIFEavB2-qYAGQsF4',
            user: 'test@hubspot.com',
            hub_domain: 'demo.hubapi.com',
            scopes: [
                'contacts',
                'automation',
                'oauth'
            ],
            hub_id: 33,
            app_id: 456,
            expires_in: 21588,
            user_id: 123,
            token_type: 'access'
        };
    });

    it('should register triggers', async () => {

        // Register the triggers
        const component = new TestComponent('contact.PropertyChange');
        // Simulate HubSpot returning the correct target URL
        context.config.appId = context.auth.profileInfo.app_id || 456;
        context.config.apiKey = 'testApiKey';
        context.appmixerApiUrl = 'https://appmixer.example.com';
        const targetURL = context.appmixerApiUrl + '/plugins/appmixer/hubspot/events';
        context.httpRequest.resolves({ data: { targetUrl: targetURL } });

        await component.start(context);

        const addListenerArgs = context.addListener.getCall(0).args[0];
        assert.equal(addListenerArgs, 'contact.PropertyChange:33', 'The trigger component should be registered by Appmixer.');
        // The access token lets the plugin (AuthHub) verify that the portal is the account's own.
        assert.equal(context.addListener.getCall(0).args[1].accessToken, context.auth.accessToken);
    });

    it('registers the listener for the token\'s portal, not profileInfo.hub_id', async () => {

        // An account holds a token per consent; this token was consented in portal 44.
        const component = new TestComponent('contact.creation');
        context.config.usesAuthHub = true;
        context.httpRequest.resolves({ data: { hub_id: 44 } });

        await component.start(context);

        assert.equal(context.httpRequest.getCall(0).args[0].url,
            `https://api.hubapi.com/oauth/v1/access-tokens/${context.auth.accessToken}`);
        assert.equal(context.addListener.getCall(0).args[0], 'contact.creation:44');
        assert.equal(await context.stateGet('portalId'), 44);

        await component.stop(context);
        assert.equal(context.removeListener.getCall(0).args[0], 'contact.creation:44', 'stop() removes the same listener');
    });

    it('falls back to profileInfo.hub_id when the token lookup fails', async () => {

        const component = new TestComponent('contact.creation');
        context.config.usesAuthHub = true;
        const error = new Error('Unauthorized');
        error.response = { status: 401 };
        context.httpRequest.rejects(error);

        await component.start(context);

        assert.equal(context.addListener.getCall(0).args[0], 'contact.creation:33');
    });

    it('should unsubscribe', async () => {

        // Unsubscribe
        const component = new TestComponent('contact.PropertyChange');
        await component.stop(context);

        const removeListenerArgs = context.removeListener.getCall(0).args[0];
        assert.equal(removeListenerArgs, 'contact.PropertyChange:33', 'The trigger component should be unregistered by Appmixer.');
    });

    it('should throw when webhook target mismatches', async () => {

        const component = new TestComponent('contact.PropertyChange');
        context.config.appId = context.auth.profileInfo.app_id || 456;
        context.config.apiKey = 'testApiKey';
        context.appmixerApiUrl = 'https://appmixer.example.com';

        // HubSpot returns a different target URL
        context.httpRequest.resolves({ data: { targetUrl: 'https://other.example.com/hooks' } });

        try {
            await component.start(context);
            throw new Error('Expected start() to throw CancelError due to wrong target URL');
        } catch (err) {
            assert.equal(err.name, 'CancelError');
            assert.ok(err.message.indexOf('wrong target URL') !== -1);
        }
    });

    it('should register webhook when not found (404) and then fail startup', async () => {

        const component = new TestComponent('contact.PropertyChange');
        context.config.appId = context.auth.profileInfo.app_id || 456;
        context.config.apiKey = 'testApiKey';
        context.appmixerApiUrl = 'https://appmixer.example.com';

        // Make httpRequest GET throw a 404-like error
        const error404 = new Error('Not Found');
        error404.response = { status: 404 };
        context.httpRequest.rejects(error404);

        // Spy on hubspot.registerWebhook - it's invoked via this.hubspot.registerWebhook inside the component
        // Replace the hubspot instance on the component with a mock that has registerWebhook
        const registerSpy = sinon.stub().resolves();
        component.hubspot = {
            registerWebhook: registerSpy,
            setApiKey: sinon.stub(),
            setAppId: sinon.stub(),
            setToken: sinon.stub()
        };

        // Run start - it should call registerWebhook but then throw CancelError because webhookConfiguredProperly remains false
        try {
            await component.start(context);
            throw new Error('Expected start() to throw CancelError after registerWebhook');
        } catch (err) {
            assert.equal(err.name, 'CancelError');
            assert.ok(registerSpy.calledOnce, 'Expected registerWebhook to be called when webhook not found');
            // Ensure addListener was not called due to the failure
            assert.equal(context.addListener.callCount, 0);
        }
    });

});
