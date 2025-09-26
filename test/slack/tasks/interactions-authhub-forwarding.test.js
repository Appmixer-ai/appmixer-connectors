const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils.js');

/**
 * Tests the scenario:
 * - Appmixer runs as AuthHub (AUTH_HUB_URL set, no AUTH_HUB_TOKEN)
 * - User clicks Approve in a Slack message (block_actions)
 * - AuthHub /interactions receives the request and forwards it to the tenant /interactions
 * - The tenant processes the interaction and triggers the proper component/webhook
 */

describe('Slack Tasks interactions - AuthHub forwarding to tenant', () => {

    let authHubContext;
    let tenantContext;
    let routes;
    let slackLib;
    let utilsTriggerWebhookStub;

    beforeEach(async () => {
        // Create standard mock contexts
        authHubContext = testUtils.createMockContext({ http: { router: { register: sinon.stub() } } });
        tenantContext = testUtils.createMockContext({ http: { router: { register: sinon.stub() } } });

        // Minimal Joi shim expected by routes (keeps tests simple)
        const minimalJoi = {
            string: () => ({ required: () => ({}), uri: () => ({ required: () => ({}) }), valid: () => ({}) }),
            date: () => ({ iso: () => ({}) }),
            object: () => ({}),
            number: () => ({ integer: () => ({ min: () => ({ max: () => ({ default: () => ({}) }) }) }) })
        };
        authHubContext.http.Joi = minimalJoi;
        tenantContext.http.Joi = minimalJoi;

        // AuthHub-specific methods used by routes-tasks AuthHub branch
        authHubContext.getListeners = sinon.stub();

        // In-memory Task model stub (shared for both contexts) - keep minimal and reliable
        const memory = { tasks: {} };
        const taskModelPath = require.resolve('../../../src/appmixer/slack/tasks/SlackTaskModel.js');
        require.cache[taskModelPath] = {
            id: taskModelPath,
            filename: taskModelPath,
            loaded: true,
            exports: () => {
                class Task {
                    static get STATUS_PENDING() { return 'pending'; }
                    static get STATUS_REJECTED() { return 'rejected'; }
                    static get STATUS_APPROVED() { return 'approved'; }
                    static async findById(id) { return memory.tasks[id]; }
                    static async find() { return []; }
                    populate(obj) {
                        const id = obj.taskId || 'TS1';
                        const entity = Object.assign({ taskId: id }, obj);
                        memory.tasks[id] = {
                            ...entity,
                            toJson: () => entity,
                            getStatus: () => entity.status,
                            setStatus: (s) => { entity.status = s; },
                            setDecisionMade: (d) => { entity.decisionMade = d; },
                            setActor: (a) => { entity.actor = a; },
                            getId: () => id,
                            approver: entity.approver,
                            addIsApprover: () => ({ toJson: () => entity }),
                            save: async () => entity
                        };
                        return { save: async () => entity };
                    }
                }
                Task.createSettersAndGetters = () => {};
                return Task;
            }
        };

        // Stub slack/tasks/utils.js with a spy-able triggerWebhook using minimal export
        const utilsPath = require.resolve('../../../src/appmixer/slack/tasks/utils.js');
        utilsTriggerWebhookStub = sinon.stub().resolves();
        require.cache[utilsPath] = {
            id: utilsPath,
            filename: utilsPath,
            loaded: true,
            exports: () => ({ triggerWebhook: utilsTriggerWebhookStub, getTask: async () => ({}) })
        };

        // Prepare routes module and common slack lib; ensure signature validation passes by default
        routes = require('../../../src/appmixer/slack/routes-tasks.js');
        slackLib = require('../../../src/appmixer/slack/lib.js');
        // slackLib?.isValidPayload?.restore();
        sinon.stub(slackLib, 'isValidPayload').returns(true);

        // Register routes for both contexts
        await routes(authHubContext);
        await routes(tenantContext);

        // Helper to fetch a route handler from a context
        const getHandler = (ctx, method, path) => {
            const call = ctx.http.router.register.getCalls()
                .find(c => c.args[0].method === method && c.args[0].path === path);
            return call && call.args[0].options.handler;
        };
        authHubContext.getRouteHandler = (m, p) => getHandler(authHubContext, m, p);
        tenantContext.getRouteHandler = (m, p) => getHandler(tenantContext, m, p);

        // Flag the first context as AuthHub pod
        process.env.AUTH_HUB_URL = 'https://auth-hub.example.com';
        delete process.env.AUTH_HUB_TOKEN;
    });

    afterEach(() => {
        sinon.restore();
        delete process.env.AUTH_HUB_URL;
        delete process.env.AUTH_HUB_TOKEN;
        // Clean module cache of lib stubs if needed
        try { delete require.cache[require.resolve('../../../src/appmixer/slack/tasks/SlackTaskModel.js')]; } catch (_) {}
        try { delete require.cache[require.resolve('../../../src/appmixer/slack/tasks/utils.js')]; } catch (_) {}
    });

    it('forwards Approve to tenant and tenant triggers webhook (end-to-end)', async () => {
        // Prepare a pending task directly in the in-memory model
        const Task = require('../../../src/appmixer/slack/tasks/SlackTaskModel.js')(tenantContext);
        const created = await new Task().populate({
            taskId: 'TS-42',
            title: 'Test Task',
            description: 'Desc',
            requester: 'U_REQ',
            approver: 'U_APPR',
            channel: 'C1',
            decisionBy: new Date(),
            status: Task.STATUS_PENDING
        }).save();

        // Tenant route handler (will be invoked by our httpRequest stub)
        const tenantHandler = tenantContext.getRouteHandler('POST', '/interactions');

        // AuthHub must verify tenant webhook is active
        authHubContext.getListeners
            .withArgs('slack_task_COMPONENT-1')
            .resolves([{ id: 'listener-1' }]);

        // Build Slack interaction payload (form-encoded with Buffer)
        const payload = {
            type: 'block_actions',
            user: { id: 'U_APPR' },
            response_url: 'https://hooks.slack.com/actions/T/XXX/YYY',
            message: {
                blocks: [
                    { type: 'section', text: { type: 'mrkdwn', text: '*Test Task*\nDesc' } },
                    { type: 'actions', elements: [{ type: 'button', action_id: 'task_approve', value: `${created.taskId}|https://tenant.example.com` }] }
                ]
            },
            actions: [{ action_id: 'task_approve', value: `${created.taskId}|https://tenant.example.com` }]
        };
        const body = 'payload=' + encodeURIComponent(JSON.stringify(payload));
        const req = { payload: Buffer.from(body) };

        // When AuthHub forwards, simulate posting to the tenant handler
        authHubContext.httpRequest.resolves({
            data: body,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        });

        // Call AuthHub interactions handler
        const authHubHandler = authHubContext.getRouteHandler('POST', '/interactions');
        const h = { response: sinon.stub().returns({ code: sinon.stub() }) };
        await authHubHandler(req, h);

        // AuthHub - Assert httpRequest was called once with proper args
        sinon.assert.calledOnce(authHubContext.httpRequest);
        const opts = authHubContext.httpRequest.getCall(0).args[0];
        assert.equal(opts.method, 'POST', 'httpRequest method');
        assert.equal(opts.url, 'https://tenant.example.com/plugins/appmixer/slack/interactions', 'httpRequest url');
        assert.equal(opts.headers['Content-Type'], 'application/x-www-form-urlencoded', 'httpRequest content-type');
        // The forwarded body should be exactly the original Buffer
        assert.ok(Buffer.isBuffer(opts.data), 'Forwarded data must be Buffer');
        assert.deepEqual(opts.data, req.payload, 'Forwarded data must match original payload');

        // Switching to tenant context now
        process.env.AUTH_HUB_URL = 'https://auth-hub.example.com';
        process.env.AUTH_HUB_TOKEN = 'SECRET';

        // Tenant - Assertions after tenant processed the interaction
        await tenantHandler(req, h);

        // Forward happened and tenant got it; webhook should be triggered once
        assert.equal(utilsTriggerWebhookStub.callCount, 1, 'Tenant should trigger a webhook for the approved task');

        // Verify tenant task status is now approved
        const getHandler = tenantContext.getRouteHandler('GET', '/tasks/{taskId}');
        const fetched = await getHandler({ params: { taskId: created.taskId }, query: {} });
        assert.equal(fetched.status, 'approved');

        // The AuthHub response relays the tenant response
        assert.equal(h.response.callCount, 2, 'AuthHub should respond once after forwarding and once after tenant processing');
        const out = h.response.getCall(0).args[0];
        assert.deepEqual(out, body);
    });

    it('returns 400 when host missing in action value (AuthHub)', async () => {
        const authHubHandler = authHubContext.getRouteHandler('POST', '/interactions');
        const payload = { type: 'block_actions', user: { id: 'U' }, actions: [{ action_id: 'task_approve', value: 'TS-1' }] };
        const body = 'payload=' + encodeURIComponent(JSON.stringify(payload));
        const h = { response: sinon.stub().returns({ code: sinon.stub() }) };

        await authHubHandler({ payload: Buffer.from(body) }, h);

        assert.equal(h.response.callCount, 1);
        assert.equal(h.response.getCall(0).returnValue.code.getCall(0).args[0], 400);
    });

    it('returns 400 when tenant host equals AUTH_HUB_URL (AuthHub)', async () => {
        const authHubHandler = authHubContext.getRouteHandler('POST', '/interactions');
        const payload = { type: 'block_actions', user: { id: 'U' }, actions: [{ action_id: 'task_approve', value: 'TS-1|https://auth-hub.example.com' }] };
        const body = 'payload=' + encodeURIComponent(JSON.stringify(payload));
        const h = { response: sinon.stub().returns({ code: sinon.stub() }) };

        await authHubHandler({ payload: Buffer.from(body) }, h);

        assert.equal(h.response.callCount, 1);
        assert.equal(h.response.getCall(0).returnValue.code.getCall(0).args[0], 400);
    });

    it('returns 400 when tenant webhook not active (AuthHub)', async () => {
        const authHubHandler = authHubContext.getRouteHandler('POST', '/interactions');
        // No listeners available at tenant
        authHubContext.getListeners.resolves([]);

        // AuthHub httpRequest to tenant results in 400. Axios-like response
        authHubContext.httpRequest.resolves({
            data: { ok: false, error: 'Flow stopped.' },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config: {}
        });

        const payload = { type: 'block_actions', user: { id: 'U' }, actions: [{ action_id: 'task_approve', value: 'TS-1|https://tenant.example.com' }] };
        const body = 'payload=' + encodeURIComponent(JSON.stringify(payload));
        const h = { response: sinon.stub().returns({ code: sinon.stub() }) };

        await authHubHandler({ payload: Buffer.from(body) }, h);

        assert.equal(h.response.callCount, 1);
        assert.equal(h.response.getCall(0).returnValue.code.getCall(0).args[0], 400);
    });

    it('returns 401 when Slack signature invalid (AuthHub)', async () => {
        const authHubHandler = authHubContext.getRouteHandler('POST', '/interactions');
        // Override validation to fail
        slackLib.isValidPayload.restore();
        sinon.stub(slackLib, 'isValidPayload').returns(false);

        const payload = { type: 'block_actions', user: { id: 'U' }, actions: [{ action_id: 'task_approve', value: 'TS-1|https://tenant.example.com' }] };
        const body = 'payload=' + encodeURIComponent(JSON.stringify(payload));

        const codeStub = sinon.stub();
        const h = { response: sinon.stub().returns({ code: codeStub }) };
        await authHubHandler({ payload: Buffer.from(body) }, h);

        assert(codeStub.calledWith(401), 'Should return 401 for invalid signature at AuthHub boundary');
    });
});
