const assert = require('assert');
const sinon = require('sinon');
const { createHmac } = require('node:crypto');
const testUtils = require('../../../../../test/utils.js');
const routes = require('../../routes.js');
const auth = require('../../auth.js');

function signedRequest(payload) {

    const timestamp = '1737024600';
    const baseString = `v0:${timestamp}:${JSON.stringify(payload)}`;
    const signature = 'v0=' + createHmac('sha256', 'signing_secret').update(baseString).digest('hex');
    return { payload, headers: { 'x-slack-signature': signature, 'x-slack-request-timestamp': timestamp } };
}

describe('POST /events: app_mention and reaction_added', () => {

    let context;
    let handler;
    const h = { response: sinon.stub().returns({ code: sinon.stub() }) };

    beforeEach(async () => {
        context = {
            ...testUtils.createMockContext(),
            http: { router: { register: sinon.stub() } }
        };
        context.config = { signingSecret: 'signing_secret', authToken: 'xapp-token', usesAuthHub: false };
        await routes(context);
        handler = context.http.router.register.getCall(0).args[0].options.handler;
        // apps.event.authorizations.list: the users who can see the event.
        context.httpRequest.resolves({ data: { ok: true, authorizations: [{ user_id: 'U_SEES' }] } });
    });

    for (const [type, eventName, event] of [
        ['app_mention', 'slack_app_mention', { type: 'app_mention', user: 'U1', text: '<@B1> hi', ts: '1', channel: 'C1' }],
        ['reaction_added', 'slack_reaction_added', { type: 'reaction_added', user: 'U1', reaction: 'ticket', item: { type: 'message', channel: 'C1', ts: '1' } }]
    ]) {
        it(`${type} reaches only listeners of users who can see the event`, async () => {
            await handler(signedRequest({ type: 'event_callback', team_id: 'T1', event_context: 'ctx', event }), h);

            assert.strictEqual(context.triggerListeners.callCount, 1);
            const { eventName: name, payload, filter } = context.triggerListeners.getCall(0).args[0];
            assert.strictEqual(name, eventName);
            assert.deepStrictEqual(payload, event);
            assert.strictEqual(filter({ params: { userId: 'U_SEES' } }), true);
            assert.strictEqual(filter({ params: { userId: 'U_OTHER_TENANT' } }), false);
        });
    }

    it('delivers nothing when Slack refuses the authorization lookup', async () => {
        context.httpRequest.resolves({ data: { ok: false, error: 'invalid_auth' } });
        await handler(signedRequest({ type: 'event_callback', event: { type: 'app_mention', channel: 'C1' } }), h);
        assert.strictEqual(context.triggerListeners.callCount, 0);
    });
});

describe('auth.js authUrl: bot-only scopes', () => {

    const authUrl = scope => {
        const context = { clientId: 'cid', callbackUrl: 'https://cb', ticket: 't', scope: [...scope] };
        return new URL(auth.definition().authUrl(context)).searchParams;
    };

    it('requests app_mentions:read as a bot scope only', () => {
        const params = authUrl(['app_mentions:read', 'channels:read']);
        assert.strictEqual(params.get('user_scope'), 'channels:read,groups:history');
        assert.ok(params.get('scope').split(',').includes('app_mentions:read'));
    });

    it('keeps the previous behaviour for user scopes', () => {
        const params = authUrl(['channels:read', 'chat:write']);
        assert.strictEqual(params.get('user_scope'), 'channels:read,chat:write,groups:history');
        assert.ok(params.get('scope').split(',').includes('chat:write'));
        assert.strictEqual(authUrl(['users:read']).get('scope'), null);
    });
});
