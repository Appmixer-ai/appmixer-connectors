const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils.js');

// Basic route handler tests for People Tasks (utils/tasks)
describe('utils/tasks routes', () => {

    let context;
    let routes;
    // h toolkit stub is created per test when needed

    beforeEach(async () => {
        context = testUtils.createMockContext();
        const JoiStub = {
            string: () => ({
                required: () => ({}),
                email: () => ({ required: () => ({}) }),
                uri: () => ({ required: () => ({}) })
            }),
            date: () => ({ iso: () => ({}) }),
            object: () => ({})
        };
        context.http = {
            router: { register: sinon.stub() },
            Joi: JoiStub,
            auth: {
                getUser: sinon.stub().resolves({
                    getId: () => ({ equals: () => false }),
                    getEmail: () => 'approver@example.com'
                })
            },
            HttpError: class {
                static badRequest(msg) { const e = new Error(msg); e.code = 400; return e; }
                static forbidden() { const e = new Error('forbidden'); e.code = 403; return e; }
                static notFound(msg) { const e = new Error(msg); e.code = 404; return e; }
            }
        };
        // In-memory stores for tasks/webhooks used by our stubs
        const memory = { tasks: {}, webhooks: {} };

        // Stub lib.js (parseMD) to avoid external deps
        const libPath = require.resolve('../../../src/appmixer/utils/tasks/lib.js');
        require.cache[libPath] = {
            id: libPath,
            filename: libPath,
            loaded: true,
            exports: { parseMD: (ctx, md) => md }
        };

        // Stub utils.js to control behavior inside routes
        const utilsPath = require.resolve('../../../src/appmixer/utils/tasks/utils.js');
        require.cache[utilsPath] = {
            id: utilsPath,
            filename: utilsPath,
            loaded: true,
            exports: () => ({
                generateSecret: async (email) => 'secret-' + email,
                prepareTasksQuery: async () => ({ selector: {}, limit: 50, offset: 0 }),
                triggerWebhooks: async () => {},
                getTask: async (req) => memory.tasks[req.params.taskId],
                verifyTaskPerm: async () => true
            })
        };

        // Stub TaskModel.js with in-memory persistence and needed constants
        const taskModelPath = require.resolve('../../../src/appmixer/utils/tasks/TaskModel.js');
        require.cache[taskModelPath] = {
            id: taskModelPath,
            filename: taskModelPath,
            loaded: true,
            exports: () => {
                class Task {
                    static get STATUS_PENDING() { return 'pending'; }
                    static get STATUS_REJECTED() { return 'rejected'; }
                    static get STATUS_APPROVED() { return 'approved'; }
                    static async find() { return Object.values(memory.tasks); }
                    static async count() { return Object.keys(memory.tasks).length; }
                    static async findById(id) { return memory.tasks[id]; }
                    populate(obj) {
                        const id = obj.taskId || 'T' + Math.random().toString(36).slice(2, 8);
                        const entity = Object.assign({ taskId: id }, obj);
                        memory.tasks[id] = {
                            ...entity,
                            toJson: () => entity,
                            getStatus: () => entity.status,
                            setStatus: (s) => { entity.status = s; },
                            setDecisionMade: (d) => { entity.decisionMade = d; },
                            getId: () => id,
                            getApprover: () => entity.approver,
                            getApproverSecret: () => entity.approverSecret,
                            save: async () => entity,
                            addIsApprover: () => ({ toJson: () => entity })
                        };
                        return { save: async () => entity };
                    }
                }
                Task.createSettersAndGetters = () => {};
                return Task;
            }
        };

        // Stub WebhookModel.js with in-memory persistence
        const webhookModelPath = require.resolve('../../../src/appmixer/utils/tasks/WebhookModel.js');
        require.cache[webhookModelPath] = {
            id: webhookModelPath,
            filename: webhookModelPath,
            loaded: true,
            exports: () => {
                class Webhook {
                    static get STATUS_SENT() { return 'sent'; }
                    static get STATUS_FAIL() { return 'fail'; }
                    static get STATUS_PENDING() { return 'pending'; }
                    static async find() { return Object.values(memory.webhooks); }
                    static async findById(id) { return memory.webhooks[id]; }
                    static async deleteById(id) { delete memory.webhooks[id]; }
                    populate(obj) {
                        const id = obj.webhookId || 'W' + Math.random().toString(36).slice(2, 8);
                        const entity = Object.assign({ webhookId: id }, obj);
                        memory.webhooks[id] = {
                            ...entity,
                            getId: () => id,
                            getTaskId: () => entity.taskId,
                            getUrl: () => entity.url,
                            save: async () => entity
                        };
                        return { save: async () => entity };
                    }
                }
                Webhook.createSettersAndGetters = () => {};
                return Webhook;
            }
        };

        // Now require routes after stubbing dependencies
        routes = require('../../../src/appmixer/utils/tasks/routes.js');

        // Minimal config
        context.config.dashboardUrl = 'https://dashboard.example.com';

        await routes(context, { secret: 's3cr3t' });

        // expose handler lookup helper
        context.getRouteHandler = (method, path) => {
            const call = context.http.router.register
                .getCalls()
                .find(c => c.args[0].method === method && c.args[0].path === path);
            return call.args[0].options.handler;
        };
    });

    it('POST /webhooks stores webhook', async () => {
        const handler = context.getRouteHandler('POST', '/webhooks');
        const res = await handler({ payload: { url: 'https://example.com/w', taskId: 'T1' } });
        assert.strictEqual(res.url, 'https://example.com/w');
        assert.strictEqual(res.taskId, 'T1');
        assert.ok(res.webhookId);
    });

    it('POST /tasks creates task with secrets and dates', async () => {
        const handler = context.getRouteHandler('POST', '/tasks');
        const now = new Date().toISOString();
        const res = await handler({ payload: {
            title: 'Title', description: 'Desc', requester: 'r@example.com', approver: 'a@example.com', decisionBy: now
        } });
        assert.strictEqual(res.title, 'Title');
        assert.strictEqual(res.approverSecret, 'secret-a@example.com');
        assert.strictEqual(res.requesterSecret, 'secret-r@example.com');
        assert.ok(res.created);
        assert.ok(res.decisionBy instanceof Date);
    });

    it('PUT /tasks/{taskId}/approve transitions and triggers webhooks', async () => {
        const create = context.getRouteHandler('POST', '/tasks');
        const task = await create({ payload: { title: 'T', description: 'D', requester: 'r@e.com', approver: 'a@e.com', decisionBy: new Date().toISOString() } });
        const approve = context.getRouteHandler('PUT', '/tasks/{taskId}/approve');
        const res = await approve({ params: { taskId: task.taskId }, pre: {} });
        assert.strictEqual(res.status, 'approved');
        assert.ok(res.decisionMade instanceof Date);
    });

    it('PUT /tasks/{taskId}/reject transitions and triggers webhooks', async () => {
        const create = context.getRouteHandler('POST', '/tasks');
        const task = await create({ payload: { title: 'T', description: 'D', requester: 'r@e.com', approver: 'a@e.com', decisionBy: new Date().toISOString() } });
        const reject = context.getRouteHandler('PUT', '/tasks/{taskId}/reject');
        const res = await reject({ params: { taskId: task.taskId }, pre: {} });
        assert.strictEqual(res.status, 'rejected');
        assert.ok(res.decisionMade instanceof Date);
    });

    it('GET /dashboard-url returns configured dashboard URL', async () => {
        const handler = context.getRouteHandler('GET', '/dashboard-url');
        const res = await handler({});
        assert.deepStrictEqual(res, { dashboardUrl: 'https://dashboard.example.com' });
    });
});
