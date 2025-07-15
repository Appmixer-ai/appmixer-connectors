const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../utils.js');

describe.skip('Slack RequestApproval HTTP API', () => {

    let context;
    let h;

    beforeEach(async () => {

        registeredRoutes = {};
        context = {
            ...testUtils.createMockContext(),
            http: {
                router: {
                    register: sinon.stub()
                },
                Joi: require('joi'),
                // HttpError: { badRequest: (msg) => new Error(msg) },
                auth: { getUser: async () => ({ slackUserId: 'U123' }) }
            },
            utils: {
                P: { mapArray: async (arr, fn) => Promise.all(arr.map(fn)) },
                Error: { stringify: (e) => e.toString() }
            }
        };

        h = {
            response: sinon.stub().returns({ code: sinon.stub() })
        };

        // Register the routes the same way Appmixer does.
        require('../../src/appmixer/slack/tasks/routes.js')(context);
    });

    /** Performs the same actions as the Slack RequestApproval component. */
    describe('RequestApproval - create', () => {

        it('should create a task and a webhook', async () => {

            // POST /tasks
            const handlerPostTasks = context.http.router.register.getCall(4).args[0].options.handler;
            const req = {
                payload: {
                    channel: 'C123',
                    title: 'Test Title',
                    description: 'Test Description',
                    requester: 'U1',
                    approver: 'U2',
                    decisionBy: new Date().toISOString()
                },
                method: 'POST'
            };
            const taskFromRoute = await handlerPostTasks(req, h);
            const taskFromDb = global.mongoCollections['slack_tasks'][taskFromRoute.taskId];
            assert.deepEqual(taskFromRoute, taskFromDb, 'Task returned from route should match task in DB');
            // End result is that we have a task and a webhook created in the database.
            assert.equal(taskFromRoute.title, req.payload.title);
            assert.strictEqual(taskFromRoute.description, req.payload.description);
            assert.strictEqual(taskFromRoute.requester, req.payload.requester);
            assert.strictEqual(taskFromRoute.approver, req.payload.approver);
            assert.equal(new Date(taskFromRoute.decisionBy).getTime(), new Date(req.payload.decisionBy).getTime());
            assert.strictEqual(taskFromRoute.status, 'pending');
            assert.strictEqual(taskFromRoute.channel, 'C123');

            // POST /tasks/webhooks
            const handlerPostWebhooks = context.http.router.register.getCall(1).args[0].options.handler;
            const reqWebhook = {
                payload: {
                    url: 'http://test',
                    taskId: 'T1'
                },
                method: 'POST'
            };
            const webhookFromRoute = await handlerPostWebhooks(reqWebhook, h);
            const webhookFromDb = global.mongoCollections['slack_webhooks'][webhookFromRoute.webhookId];
            assert.deepEqual(webhookFromRoute, webhookFromDb, 'Webhook returned from route should match webhook in DB');

            assert.strictEqual(webhookFromRoute.url, 'http://test');
            assert.strictEqual(webhookFromRoute.taskId, 'T1');
            assert.strictEqual(webhookFromRoute.status, 'pending');
        });
    });

    describe('/interactions', () => {

        it('should process messages', async () => {
            const handler = context.http.router.register.getCall(6).args[0].options.handler;
            context.config = context.config || {};
            context.config.signingSecret = 'dummy_secret';
            const payloadObj = {
                type: 'block_actions',
                user: { id: 'U123' },
                message: {
                    text: 'Test message with spaces'
                },
                response_url: 'https://hooks.slack.com/interactive-response/1234567890',
                channel: { id: 'C123' },
                actions: [
                    { action_id: 'approve_task', block_id: '1234567890.123456', value: 'T123' }
                ]
            };
            const timestamp = '1234567890';
            const signingSecret = context.config.signingSecret;
            const baseString = `v0:${timestamp}:payload=${JSON.stringify(payloadObj)}`;
            const mySignature = 'v0=' + require('node:crypto').createHmac('sha256', signingSecret).update(baseString).digest('hex');

            const req = {
                // Simulate Slack sending the payload as a form-urlencoded string
                // This results in Hapi server receiving the payload as a Buffer
                payload: `payload=${Buffer.from(JSON.stringify(payloadObj))}`,
                method: 'POST',
                headers: {
                    'x-slack-signature': mySignature,
                    'x-slack-request-timestamp': timestamp,
                    'content-type': 'application/x-www-form-urlencoded'
                }
            };
            const response = await handler(req, h);
            assert.equal(response.statusCode, 200);
        });

        it('should handle errors', async () => {
            const handler = context.http.router.register.getCall(6).args[0].options.handler;
            context.config = context.config || {};
            context.config.signingSecret = 'dummy_secret';
            const payloadObj = {
                type: 'block_actions',
                user: { id: 'U123' },
                channel: { id: 'C123' },
                actions: [
                    { action_id: 'reject_task', block_id: '1234567890.123456', value: 'T123' }
                ]
            };
            const timestamp = '1234567890';
            const signingSecret = context.config.signingSecret;
            const baseString = `v0:${timestamp}:payload=${JSON.stringify(payloadObj)}`;
            const mySignature = 'v0=' + require('node:crypto').createHmac('sha256', signingSecret).update(baseString).digest('hex');
            const req = {
                payload: `payload=${Buffer.from(JSON.stringify(payloadObj))}`,
                method: 'POST',
                headers: {
                    'x-slack-signature': mySignature,
                    'x-slack-request-timestamp': timestamp,
                    'content-type': 'application/x-www-form-urlencoded'
                }
            };
            const response = await handler(req, h);
            assert.equal(response.statusCode, 200);
        });
    });
});
