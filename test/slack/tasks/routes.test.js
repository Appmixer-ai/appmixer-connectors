const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils.js');

// Slack Tasks routes tests (prepare now, expect failures until implementation aligns)

describe('Slack Tasks routes', () => {

    let context;
    let routes;
    let slackLib;

    beforeEach(async () => {
        context = testUtils.createMockContext();

        // Stub router and Joi, HttpError
        const JoiStub = {
            string: () => ({ required: () => ({}), uri: () => ({ required: () => ({}) }) }),
            date: () => ({ iso: () => ({}) }),
            object: () => ({})
        };
        context.http = {
            router: { register: sinon.stub() },
            Joi: JoiStub,
            HttpError: class {
                static badRequest(msg) { const e = new Error(msg); e.code = 400; return e; }
            }
        };

        // In-memory stores
        const memory = { tasks: {}, webhooks: {} };

        // Stub Slack models via require cache
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
                    populate(obj) {
                        const id = obj.taskId || 'TS1';
                        const entity = Object.assign({ taskId: id }, obj);
                        memory.tasks[id] = {
                            ...entity,
                            toJson: () => entity,
                            getStatus: () => entity.status,
                            setStatus: (s) => { entity.status = s; },
                            setDecisionMade: (d) => { entity.decisionMade = d; },
                            getId: () => id,
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

        const webhookModelPath = require.resolve('../../../src/appmixer/slack/tasks/SlackWebhookModel.js');
        require.cache[webhookModelPath] = {
            id: webhookModelPath,
            filename: webhookModelPath,
            loaded: true,
            exports: () => {
                class Webhook {
                    static get STATUS_SENT() { return 'sent'; }
                    static get STATUS_FAIL() { return 'fail'; }
                    static get STATUS_PENDING() { return 'pending'; }
                    static async deleteById(id) { delete memory.webhooks[id]; }
                    populate(obj) {
                        const id = obj.webhookId || 'W1';
                        const entity = Object.assign({ webhookId: id }, obj);
                        memory.webhooks[id] = entity;
                        return { save: async () => entity };
                    }
                }
                Webhook.createSettersAndGetters = () => {};
                return Webhook;
            }
        };

        // Stub slack lib sendMessage
        slackLib = require('../../../src/appmixer/slack/lib.js');
        sinon.stub(slackLib, 'sendMessage').resolves({ ok: true });

        // Stub slack/tasks/utils.js before requiring routes to avoid external deps
        const utilsPath = require.resolve('../../../src/appmixer/slack/tasks/utils.js');
        require.cache[utilsPath] = {
            id: utilsPath,
            filename: utilsPath,
            loaded: true,
            exports: () => ({
                triggerWebhooks: async () => {},
                getTask: async () => ({}),
                verifyTaskPerm: async () => true,
                omitSecrets: (t) => t
            })
        };

        // Load and register routes
        routes = require('../../../src/appmixer/slack/routes-tasks.js');
        await routes(context);

        // Helper to fetch handler
        context.getRouteHandler = (method, path) => {
            const call = context
                .http
                .router
                .register
                .getCalls()
                .find(c => c.args[0].method === method && c.args[0].path === path);
            return call && call.args[0].options.handler;
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('POST /tasks creates a task and notifies approver', async () => {
        const handler = context.getRouteHandler('POST', '/tasks');
        const res = await handler({ payload: { title: 'T', description: 'D', requester: 'U1', approver: 'U2', channel: 'C1', decisionBy: new Date().toISOString() } });

        assert.equal(res.title, 'T');
        // Expectation (may fail until implemented): send a Slack notification to approver
        assert(slackLib.sendMessage.calledOnce, 'sendMessage should notify approver');
    });

    it('PUT /tasks/{taskId}/approve transitions state and notifies requester', async () => {
        // First create a task
        const create = context.getRouteHandler('POST', '/tasks');
        const task = await create({ payload: { title: 'T', description: 'D', requester: 'U1', approver: 'U2', channel: 'C1', decisionBy: new Date().toISOString(), status: 'pending' } });
        const approve = context.getRouteHandler('PUT', '/tasks/{taskId}/approve');
        const res = await approve({ params: { taskId: task.taskId }, query: { slackUserId: 'U2' } });

        assert.equal(res.status, 'approved');
        // Expectation (may fail): requester notified
        assert(slackLib.sendMessage.called, 'Requester should be notified on approve');
    });

    it('PUT /tasks/{taskId}/reject transitions state and notifies requester', async () => {
        const create = context.getRouteHandler('POST', '/tasks');
        const task = await create({ payload: { title: 'T', description: 'D', requester: 'U1', approver: 'U2', channel: 'C1', decisionBy: new Date().toISOString(), status: 'pending' } });
        const reject = context.getRouteHandler('PUT', '/tasks/{taskId}/reject');
        const res = await reject({ params: { taskId: task.taskId }, query: { slackUserId: 'U2' } });

        assert.equal(res.status, 'rejected');
        assert(slackLib.sendMessage.called, 'Requester should be notified on reject');
    });

    it('does not expose dashboard endpoint for Slack routes', async () => {
        const hasDashboard = context.http.router.register.getCalls().some(c => c.args[0].path === '/dashboard-url');
        assert.equal(hasDashboard, false);
    });
});
