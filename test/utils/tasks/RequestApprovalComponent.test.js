const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils.js');

// Tests for appmixer.utils.tasks.RequestApproval component
describe('Utils RequestApproval component', () => {

    let context;

    beforeEach(async () => {
        context = testUtils.createMockContext();
        // getWebhookUrl is required by component to register webhook
        context.getWebhookUrl.returns('https://example.com/webhook');
        context.callAppmixer = sinon.stub();
        context.sendJson = sinon.stub();
        context.stateSet = sinon.stub();
    });

    it('creates task, emits created, registers webhook, saves state', async () => {
        // Arrange input and stubs
        const iso = new Date().toISOString();
        context.messages = {
            task: {
                content: {
                    title: 'Title',
                    description: 'Desc',
                    requester: 'requester@example.com',
                    approver: 'approver@example.com',
                    decisionBy: iso
                }
            }
        };

        // First call creates task
        context.callAppmixer.onFirstCall().resolves({
            taskId: 'T1',
            title: 'Title',
            description: 'Desc',
            requester: 'requester@example.com',
            approver: 'approver@example.com',
            decisionBy: iso
        });
        // Second call registers webhook
        context.callAppmixer.onSecondCall().resolves({ webhookId: 'W1' });

        const Component = require('../../../src/appmixer/utils/tasks/RequestApproval/RequestApproval.js');

        // Act
        await Component.receive(context);

        // Assert task creation call
        assert.deepStrictEqual(context.callAppmixer.firstCall.args[0], {
            endPoint: '/plugins/appmixer/utils/tasks/tasks',
            method: 'POST',
            body: context.messages.task.content
        });

        // Assert emitted created with normalized task shape (id instead of taskId)
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const [payload, port] = context.sendJson.firstCall.args;
        assert.strictEqual(port, 'created');
        assert.strictEqual(payload.id, 'T1');
        assert.strictEqual(payload.title, 'Title');

        // Assert webhook registration and state save
        assert.deepStrictEqual(context.callAppmixer.secondCall.args[0], {
            endPoint: '/plugins/appmixer/utils/tasks/webhooks',
            method: 'POST',
            body: { url: 'https://example.com/webhook', taskId: 'T1' }
        });
        assert(context.stateSet.calledOnce);
        assert.strictEqual(context.stateSet.firstCall.args[0], 'W1');
        assert.deepStrictEqual(context.stateSet.firstCall.args[1], {});
    });

    it('handles webhook payload and emits to status outport, responds 200', async () => {
        // Arrange webhook message with approved status
        context.messages = {
            webhook: {
                content: {
                    data: {
                        taskId: 'T2',
                        status: 'approved',
                        title: 'Hello'
                    }
                }
            }
        };
        context.response.returns({});

        const Component = require('../../../src/appmixer/utils/tasks/RequestApproval/RequestApproval.js');

        // Act
        await Component.receive(context);

        // Assert: id mapped, sendJson called with status port
        assert(context.sendJson.calledOnce, 'sendJson should be called once for webhook event');
        const [data, port] = context.sendJson.firstCall.args;
        assert.strictEqual(port, 'approved');
        assert.strictEqual(data.id, 'T2');
        assert.strictEqual(data.taskId, undefined);
        // Also ensure response returned
        assert(context.response.calledOnce, 'response should be returned for webhook');
        assert.deepStrictEqual(context.response.firstCall.args[0], { status: 'success' });
        assert.strictEqual(context.response.firstCall.args[1], 200);
    });
});
