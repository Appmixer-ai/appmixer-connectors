const fs = require('fs');
const { cwd } = require('process');
const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils.js');

describe('Slack RequestApproval', () => {

    let context;
    let slackLib;

    before(() => {

        // Stop if there are node modules installed in the connector folder.
        const connectorPath = cwd() + '/src/appmixer/slack/node_modules';
        if (fs.existsSync(connectorPath)) {
            throw new Error(`For testing, please remove node_modules from ${connectorPath}`);
        }
        slackLib = require('../../../src/appmixer/slack/lib.js');
    });

    beforeEach(async () => {

        // Reset the context.
        context = testUtils.createMockContext();
        // Properly stub using sinon so it can be restored between tests
        sinon.stub(slackLib, 'sendMessage').resolves({ message: { text: 'testMessage' } });
    });

    [false, true].forEach((i) => {

        describe(`AuthHub ${i}`, () => {

            beforeEach(() => {
                context.config.usesAuthHub = i;
            });

            it('should call context.callAppmixer when the component is started', async () => {

                // Prepare input message
                context.messages = {
                    task: {
                        content: {
                            channel: 'C123',
                            title: 'Test Title',
                            description: 'Test Description',
                            requester: 'U1',
                            approver: 'U2',
                            decisionBy: new Date().toISOString()
                        }
                    }
                };
                context.auth = { botToken: 'xoxb-test' };

                // Stub only the first call (task creation), let the second call (webhook) return a different value
                context.callAppmixer = sinon.stub();
                context.callAppmixer.onFirstCall().resolves({
                    ...context.messages.task.content,
                    taskId: 'T123'
                });
                context.callAppmixer.onSecondCall().resolves({
                    webhookId: 'W123'
                });

                // Require the component after stubbing
                const RequestApproval = require('../../../src/appmixer/slack/tasks/RequestApproval/RequestApproval.js');
                await RequestApproval.receive(context);

                // Call to Appmixer to create the task
                assert.deepStrictEqual(context.callAppmixer.firstCall.args[0], {
                    endPoint: '/plugins/appmixer/slack/tasks',
                    method: 'POST',
                    body: {
                        ...context.messages.task.content
                    }
                }, 'context.callAppmixer should be called with the correct arguments');

                // sendJson should be called once for `created` as the second argument
                assert(context.sendJson.calledOnce, 'context.sendJson should be called once');
                const sendJsonArgs = context.sendJson.getCall(0).args;
                assert.strictEqual(sendJsonArgs[0].taskId, 'T123', 'sendJson should be called with the correct task ID');
                assert.strictEqual(sendJsonArgs[1], 'created', 'sendJson should be called with the correct status');
                assert.strictEqual(sendJsonArgs[2], undefined, 'sendJson should be called with no third argument');

                assert.equal(slackLib.sendMessage.callCount, 1, 'sendMessage should be called once');
                const callArgs = slackLib.sendMessage.getCall(0).args;
                assert.deepStrictEqual(callArgs[0], context, 'sendMessage should be called with the correct context');
                assert.strictEqual(callArgs[1], 'C123', 'sendMessage should be called with the correct channel');
                assert.strictEqual(callArgs[2], 'Test Title\nTest Description', 'sendMessage should be called with the correct text');
                assert.strictEqual(callArgs[3], true, 'sendMessage should be called as bot');
                assert.strictEqual(callArgs[4], undefined, 'thread_ts should be undefined');
                assert.strictEqual(callArgs[5], undefined, 'reply_broadcast should be undefined');
                assert.deepStrictEqual(callArgs[6], {
                    blocks: [
                        { type: 'section', text: { type: 'mrkdwn', text: '*Test Title*\nTest Description' } },
                        { type: 'context', elements: [
                            { type: 'mrkdwn', text: '*Requester:* <@U1>   *Approver:* <@U2>' },
                            { type: 'mrkdwn', text: `*Decision by:* ${context.messages.task.content.decisionBy}` }
                        ] },
                        { type: 'actions', elements: [
                            { type: 'button', text: { type: 'plain_text', text: 'Approve' }, style: 'primary', value: 'T123', action_id: 'approve_task' },
                            { type: 'button', text: { type: 'plain_text', text: 'Reject' }, style: 'danger', value: 'T123', action_id: 'reject_task' }
                        ] }
                    ]
                }, 'sendMessage should be called with the correct options');

                // Call to Appmixer to create the webhook
                assert.deepStrictEqual(context.callAppmixer.secondCall.args[0], {
                    endPoint: '/plugins/appmixer/slack/tasks/webhooks',
                    method: 'POST',
                    body: { url: context.getWebhookUrl(), taskId: 'T123' }
                }, 'context.callAppmixer should be called with the correct arguments for webhook');

                // context.stateSet should be called once
                assert(context.stateSet.calledOnce, 'context.stateSet should be called once');
                const stateSetArgs = context.stateSet.getCall(0).args;
                assert.strictEqual(stateSetArgs[0], 'W123', 'stateSet should be called with the correct webhook ID');
                assert.deepStrictEqual(stateSetArgs[1], {}, 'stateSet should be called with an empty object');
            });
        });
    });

    // Merged from test/slack/tasks/RequestApprovalComponent.test.js
    // Keep skipped until webhook handling is implemented in the component.
    describe('Webhook events', () => {
        it.skip('should notify proper user in Slack and emit event', async () => {
            const RequestApproval = require('../../../src/appmixer/slack/tasks/RequestApproval/RequestApproval.js');
            context.messages = {
                webhook: {
                    content: {
                        data: {
                            taskId: 'TS2',
                            status: 'approved',
                            approver: 'U2',
                            requester: 'U1',
                            channel: 'C1',
                            title: 'T',
                            description: 'D'
                        }
                    }
                }
            };

            await RequestApproval.receive(context);

            assert(slackLib.sendMessage.called, 'sendMessage should be called on state change');
            assert(context.sendJson.called, 'sendJson should emit state change event');
        });
    });

    afterEach(() => {
        // Ensure all stubs are cleaned up to avoid cross-test pollution
        sinon.restore();
    });
});
