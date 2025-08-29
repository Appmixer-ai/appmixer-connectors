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
        // Common default auth and task message used by many tests
        const futureDate = new Date('2053-12-31T10:59:01.000Z').toLocaleString('sv-SE', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' }).replace('T', ' ');

        context.messages = {
            task: {
                content: {
                    channel: 'C123',
                    title: 'Test Title',
                    description: 'Test Description',
                    requester: 'U1',
                    approver: 'U2',
                    decisionBy: futureDate
                }
            }
        };
        context.auth = { botToken: 'xoxb-test' };

        // default stub for callAppmixer - tests may configure behavior (onFirstCall/onSecondCall)
        context.callAppmixer = sinon.stub();
    });

    [false, true].forEach((i) => {

        describe(`AuthHub ${i}`, () => {

            beforeEach(() => {
                context.config.usesAuthHub = i;
            });

            it('should call context.callAppmixer when the component is started', async () => {

                // Use the defaults from the top-level beforeEach; configure callAppmixer responses
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

                const expectedDecisionByText = new Date('2053-12-31T10:59:01.000Z').toLocaleString('sv-SE', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' }).replace('T', ' ');
                assert.deepStrictEqual(callArgs[6], {
                    blocks: [
                        { type: 'section', text: { type: 'mrkdwn', text: '*Test Title*\nTest Description' } },
                        { type: 'context', elements: [
                            { type: 'mrkdwn', text: '*Requester:* <@U1>   *Approver:* <@U2>' },
                            { type: 'mrkdwn', text: `*Decision by:* ${expectedDecisionByText}` }
                        ] },
                        { type: 'actions', elements: [
                            { type: 'button', text: { type: 'plain_text', text: 'Approve' }, style: 'primary', value: 'T123', action_id: 'task_approve' },
                            { type: 'button', text: { type: 'plain_text', text: 'Reject' }, style: 'danger', value: 'T123', action_id: 'task_reject' }
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

            it('should throw if the due date is in the past', async () => {

                // Prepare input message with a past due date
                context.messages = {
                    task: {
                        content: {
                            ...context.messages.task.content,
                            decisionBy: new Date(Date.now() - 3600000).toISOString() // 1 hour in the past
                        }
                    }
                };

                // Require the component after stubbing
                const RequestApproval = require('../../../src/appmixer/slack/tasks/RequestApproval/RequestApproval.js');

                let error;
                try {
                    await RequestApproval.receive(context);
                } catch (err) {
                    error = err;
                }
                assert(error instanceof context.CancelError, 'Error should be an instance of CancelError');
                assert.strictEqual(error.message, 'Decision by date must be in the future.', 'Error message should match');
            });

            it('should throw if the due date is invalid', async () => {

                // Prepare input message with an invalid due date
                context.messages = {
                    task: {
                        content: {
                            ...context.messages.task.content,
                            decisionBy: 'invalid-date'
                        }
                    }
                };

                // Require the component after stubbing
                const RequestApproval = require('../../../src/appmixer/slack/tasks/RequestApproval/RequestApproval.js');

                let error;
                try {
                    await RequestApproval.receive(context);
                } catch (err) {
                    error = err;
                }
                assert(error instanceof context.CancelError, 'Error should be an instance of CancelError');
                assert.strictEqual(error.message, 'Decision by date is invalid.', 'Error message should match');
            });

            // Additional tests for missing required fields
            const requiredFields = [
                ['title', 'Title'],
                ['description', 'Description'],
                ['requester', 'Requester'],
                ['approver', 'Approver'],
                ['decisionBy', 'Decision by'],
                ['channel', 'Channel']
            ];

            requiredFields.forEach(([key, label]) => {
                it(`should throw if required field ${key} is missing`, async () => {

                    // Prepare input message with one required field missing by cloning defaults
                    const content = { ...context.messages.task.content };
                    delete content[key];

                    context.messages = { task: { content } };

                    // Require the component after stubbing
                    const RequestApproval = require('../../../src/appmixer/slack/tasks/RequestApproval/RequestApproval.js');

                    let error;
                    try {
                        await RequestApproval.receive(context);
                    } catch (err) {
                        error = err;
                    }
                    assert(error instanceof context.CancelError, 'Error should be an instance of CancelError');
                    assert.strictEqual(error.message, `${label} is required!`, 'Error message should match');
                });
            });

            it('accepts Slack user IDs only for requester and approver', async () => {

                context.messages.task.content.requester = 'U123ABCDEF';
                context.messages.task.content.approver = 'U222BBBCCC';

                context.callAppmixer.onFirstCall().resolves({
                    ...context.messages.task.content,
                    requester: 'U123ABCDEF',
                    approver: 'U222BBBCCC',
                    taskId: 'T999'
                });
                context.callAppmixer.onSecondCall().resolves({ webhookId: 'W999' });

                const RequestApproval = require('../../../src/appmixer/slack/tasks/RequestApproval/RequestApproval.js');
                await RequestApproval.receive(context);

                // Verify that raw IDs are passed through to Appmixer
                const firstArgs = context.callAppmixer.firstCall.args[0];
                assert.strictEqual(firstArgs.body.requester, 'U123ABCDEF');
                assert.strictEqual(firstArgs.body.approver, 'U222BBBCCC');

                // Verify sendMessage gets normalized mentions in blocks
                const sendArgs = slackLib.sendMessage.getCall(0).args[6];
                const contextBlock = sendArgs.blocks.find(b => b.type === 'context');
                assert(contextBlock, 'context block should exist');
                const textEl = contextBlock.elements[0].text;
                assert(textEl.includes('<@U123ABCDEF>'), 'Requester mention should be formatted as a Slack mention');
                assert(textEl.includes('<@U222BBBCCC>'), 'Approver mention should be formatted as a Slack mention');
            });

            it('throws if requester contains multiple users', async () => {

                context.messages.task.content.requester = 'U123ABCDEF,U222BBBCCC';
                context.messages.task.content.approver = 'U222BBBCCC';
                const RequestApproval = require('../../../src/appmixer/slack/tasks/RequestApproval/RequestApproval.js');
                let error;
                try {
                    await RequestApproval.receive(context);
                } catch (e) { error = e; }
                assert(error instanceof context.CancelError, 'Should throw CancelError');
                assert.match(error.message, /Requester must be a valid Slack user ID/, 'Error message should indicate invalid requester');
            });

            it('throws if approver has invalid format', async () => {

                context.messages.task.content.requester = 'U123ABCDEF';
                context.messages.task.content.approver = 'not-valid-format';
                const RequestApproval = require('../../../src/appmixer/slack/tasks/RequestApproval/RequestApproval.js');
                let error;
                try {
                    await RequestApproval.receive(context);
                } catch (e) { error = e; }
                assert(error instanceof context.CancelError, 'Should throw CancelError');
                assert.strictEqual(error.message, 'Approver must be a valid Slack user ID (e.g. U123ABCDEF).');
            });
        });
    });

    // Webhook-driven updates
    describe('Webhook events', () => {
        it('should notify Slack and emit event for non-pending status', async () => {
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

            // Should not notify Slack here. It is done in the route after validation
            assert(slackLib.sendMessage.callCount === 0, 'sendMessage should not be called from the component');

            // Should emit event with normalized id
            assert(context.sendJson.calledOnce, 'sendJson should emit state change event');
            const [payload, port] = context.sendJson.getCall(0).args;
            assert.strictEqual(port, 'approved');
            assert.strictEqual(payload.id, 'TS2');
            assert.strictEqual(payload.taskId, undefined);

            // Should respond 200 to webhook
            assert(context.response.calledOnce, 'response should be sent back to webhook');
            const resArgs = context.response.getCall(0).args;
            assert.deepStrictEqual(resArgs[0], { status: 'success' });
            assert.strictEqual(resArgs[1], 200);
        });

        it('should not emit event when status is pending but still respond', async () => {
            const RequestApproval = require('../../../src/appmixer/slack/tasks/RequestApproval/RequestApproval.js');
            context.messages = {
                webhook: {
                    content: {
                        data: {
                            taskId: 'TS3',
                            status: 'pending',
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

            // Notify Slack may happen (implementation allows), but no sendJson for pending
            assert.strictEqual(context.sendJson.called, false, 'No event should be emitted for pending');
            assert(context.response.calledOnce, 'response should be sent back to webhook');
        });
    });

    afterEach(() => {
        // Ensure all stubs are cleaned up to avoid cross-test pollution
        sinon.restore();
    });
});
