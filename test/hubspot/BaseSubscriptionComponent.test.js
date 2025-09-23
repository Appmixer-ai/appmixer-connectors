const assert = require('assert');
const testUtils = require('../utils.js');
const sinon = require('sinon');
const Base = require('../../src/appmixer/hubspot/BaseSubscriptionComponent.js');

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
