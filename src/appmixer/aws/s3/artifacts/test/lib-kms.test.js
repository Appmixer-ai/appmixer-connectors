'use strict';

const assert = require('assert');
const sinon = require('sinon');

// AWS SDK v3 clients
const s3Client = require('@aws-sdk/client-s3');
const snsClient = require('@aws-sdk/client-sns');
const kmsClient = require('@aws-sdk/client-kms');

function buildContext(properties = {}) {
    return {
        properties,
        auth: { accessKeyId: 'AKIA_TEST', secretKey: 'SECRET', userId: 123 },
        messages: { in: { content: { region: properties.region } } },
        getWebhookUrl: () => 'https://example.com/webhook',
        log: () => {},
        lock: async () => ({ unlock: async () => {} }),
        loadState: async () => ({}),
        saveState: async () => {},
        response: () => ({}),
        CancelError: class CancelError extends Error { constructor(msg) { super(msg); this.name = 'CancelError'; } }
    };
}

// Track calls per command type
let commandCalls = {};
let kmsDescribeKeyResponse = { KeyMetadata: { KeyId: '1234-uuid-key' } };
let kmsListKeyPoliciesResponse = { PolicyNames: ['default'] };
let kmsGetKeyPolicyResponse = {
    Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
            { Sid: 'EnableRoot', Effect: 'Allow', Principal: { AWS: 'arn:aws:iam::111111111111:root' }, Action: 'kms:*', Resource: '*' },
            { Effect: 'Allow', Principal: { Service: 's3.amazonaws.com' }, Action: ['kms:Decrypt', 'kms:GenerateDataKey*'], Resource: '*' }
        ]
    })
};
let kmsDescribeKeyError = null;

function resetStubs() {
    sinon.restore();
    commandCalls = {};
    kmsDescribeKeyError = null;

    // Stub the send methods on the prototypes
    sinon.stub(s3Client.S3Client.prototype, 'send').callsFake(async (command) => {
        const commandName = command.constructor.name;
        if (!commandCalls[commandName]) {
            commandCalls[commandName] = [];
        }
        commandCalls[commandName].push(command.input);

        if (commandName === 'GetBucketNotificationConfigurationCommand') {
            return { TopicConfigurations: [] };
        }
        if (commandName === 'PutBucketNotificationConfigurationCommand') {
            return {};
        }
        return {};
    });

    sinon.stub(snsClient.SNSClient.prototype, 'send').callsFake(async (command) => {
        const commandName = command.constructor.name;
        if (!commandCalls[commandName]) {
            commandCalls[commandName] = [];
        }
        commandCalls[commandName].push(command.input);

        if (commandName === 'CreateTopicCommand') {
            return { TopicArn: 'arn:aws:sns:us-east-1:111111111111:topicKms1' };
        }
        if (commandName === 'SetTopicAttributesCommand') {
            return {};
        }
        if (commandName === 'SubscribeCommand') {
            return { SubscriptionArn: 'sub-arn' };
        }
        return {};
    });

    sinon.stub(kmsClient.KMSClient.prototype, 'send').callsFake(async (command) => {
        const commandName = command.constructor.name;
        if (!commandCalls[commandName]) {
            commandCalls[commandName] = [];
        }
        commandCalls[commandName].push(command.input);

        if (commandName === 'DescribeKeyCommand') {
            if (kmsDescribeKeyError) {
                throw kmsDescribeKeyError;
            }
            return kmsDescribeKeyResponse;
        }
        if (commandName === 'ListKeyPoliciesCommand') {
            return kmsListKeyPoliciesResponse;
        }
        if (commandName === 'GetKeyPolicyCommand') {
            return kmsGetKeyPolicyResponse;
        }
        return {};
    });
}

function restoreStubs() { sinon.restore(); }

async function expectCancel(promise, msgFragment) {
    let failed = false;
    try {
        await promise;
    } catch (e) {
        assert(e instanceof Error, 'Thrown value should be Error');
        if (msgFragment) {
            assert(e.message.includes(msgFragment), `Expected error message to include "${msgFragment}", got "${e.message}"`);
        }
        failed = true;
    }
    if (!failed) {
        assert.fail('Expected promise to reject with CancelError');
    }
}

describe('s3/lib KMS validation', () => {

    beforeEach(() => {
        resetStubs();
    });

    afterEach(() => restoreStubs());

    after(() => restoreStubs());

    it('creates encrypted topic when kms key alias policy allows S3', async () => {
        // Clear require cache to get fresh module
        delete require.cache[require.resolve('../../lib')];
        const lib = require('../../lib');

        const context = buildContext({ bucket: 'bucket-a', region: 'us-east-1' });

        await lib.registerWebhook(context, { topicPrefix: 'Obj_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'alias/my-key' });

        assert(commandCalls['CreateTopicCommand'], 'CreateTopicCommand not called');
        const params = commandCalls['CreateTopicCommand'][0];
        assert.strictEqual(params.Attributes.KmsMasterKeyId, 'alias/my-key');
    });

    it('rejects invalid kmsMasterKeyId format', async () => {
        // Clear require cache to get fresh module
        delete require.cache[require.resolve('../../lib')];
        const lib = require('../../lib');

        const context = buildContext({ bucket: 'bkt', region: 'us-east-1' });
        await expectCancel(lib.registerWebhook(context, { topicPrefix: 'X_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'bad-format-key' }), 'kmsMasterKeyId format is invalid');
        assert.strictEqual(commandCalls['CreateTopicCommand'], undefined, 'Should not attempt CreateTopicCommand on invalid format');
    });

    it('rejects when describeKey fails', async () => {
        kmsDescribeKeyError = new Error('NotFound');

        // Clear require cache to get fresh module
        delete require.cache[require.resolve('../../lib')];
        const lib = require('../../lib');

        const context = buildContext({ bucket: 'bucket-a', region: 'us-east-1' });
        await expectCancel(lib.registerWebhook(context, { topicPrefix: 'Obj_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'alias/my-key' }), 'KMS key not found');
        assert.strictEqual(commandCalls['CreateTopicCommand'], undefined, 'CreateTopicCommand should not be called if describeKey fails');
    });

    it('rejects when key policy missing S3 statement', async () => {
        kmsGetKeyPolicyResponse = {
            Policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Principal: { AWS: 'arn:aws:iam::111111111111:root' },
                    Action: 'kms:*',
                    Resource: '*'
                }]
            })
        };

        // Clear require cache to get fresh module
        delete require.cache[require.resolve('../../lib')];
        const lib = require('../../lib');

        const context = buildContext({ bucket: 'bkt', region: 'us-east-1' });
        await expectCancel(lib.registerWebhook(context, { topicPrefix: 'T_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'alias/my-key' }), 'KMS key policy missing required S3 permissions');
    });

    it('rejects when key policy JSON invalid', async () => {
        kmsGetKeyPolicyResponse = { Policy: '{not-json' };

        // Clear require cache to get fresh module
        delete require.cache[require.resolve('../../lib')];
        const lib = require('../../lib');

        const context = buildContext({ bucket: 'bkt', region: 'us-east-1' });
        await expectCancel(lib.registerWebhook(context, { topicPrefix: 'T_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'alias/my-key' }), 'Unable to parse KMS key policy JSON');
    });
});
