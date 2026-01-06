'use strict';

const assert = require('assert');
const sinon = require('sinon');

// AWS SDK v3 clients
const s3Client = require('@aws-sdk/client-s3');
const snsClient = require('@aws-sdk/client-sns');
const kmsClient = require('@aws-sdk/client-kms');

// Helper to build fake context object.
function buildContext(properties = {}) {
    return {
        properties,
        auth: { accessKeyId: 'AKIA_TEST', secretKey: 'SECRET', userId: 123 },
        messages: { in: { content: { region: properties.region } } },
        getWebhookUrl: () => 'https://example.com/webhook',
        log: (msg) => { console.log('Context log:', msg); },
        lock: async () => ({ unlock: async () => {} }),
        loadState: async () => ({}),
        saveState: async () => {},
        response: () => ({})
    };
}

// Track calls per command type
let commandCalls = {};

function resetStubs() {
    sinon.restore();
    commandCalls = {};

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
            return { TopicArn: 'arn:aws:sns:us-east-1:111111111111:topic1' };
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
            return { KeyMetadata: { KeyId: 'mock-key-id' } };
        }
        if (commandName === 'ListKeyPoliciesCommand') {
            return { PolicyNames: ['default'] };
        }
        if (commandName === 'GetKeyPolicyCommand') {
            return {
                Policy: JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                        { Effect: 'Allow', Principal: { AWS: 'arn:aws:iam::111111111111:root' }, Action: 'kms:*', Resource: '*' },
                        { Effect: 'Allow', Principal: { Service: 's3.amazonaws.com' }, Action: ['kms:Decrypt', 'kms:GenerateDataKey*'], Resource: '*' }
                    ]
                })
            };
        }
        return {};
    });
}

function restoreStubs() {
    sinon.restore();
}

describe('s3/lib registerWebhook security options', () => {

    beforeEach(() => {
        resetStubs();
    });

    afterEach(() => {
        restoreStubs();
    });

    after(() => {
        restoreStubs();
    });

    it('creates encrypted topic with restrictive policy when kmsMasterKeyId and trustedAccountIds provided', async () => {
        // Clear require cache to get fresh module
        delete require.cache[require.resolve('../../lib')];
        const lib = require('../../lib');

        const context = buildContext({ bucket: 'my-bucket', region: 'us-east-1', kmsMasterKeyId: 'alias/my-key', trustedAccountIds: '123456789012, 210987654321' });

        await lib.registerWebhook(context, { topicPrefix: 'ObjectCreated_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: context.properties.kmsMasterKeyId, trustedAccountIds: context.properties.trustedAccountIds });

        // Verify createTopic got encryption attribute
        assert(commandCalls['CreateTopicCommand'], 'CreateTopicCommand not called');
        assert.strictEqual(commandCalls['CreateTopicCommand'].length, 1, 'CreateTopicCommand should be called once');
        const createParams = commandCalls['CreateTopicCommand'][0];
        assert.strictEqual(createParams.Attributes.KmsMasterKeyId, 'alias/my-key');

        // Verify restrictive policy principal list contains normalized root ARNs
        assert(commandCalls['SetTopicAttributesCommand'], 'SetTopicAttributesCommand not called');
        assert.strictEqual(commandCalls['SetTopicAttributesCommand'].length, 1, 'SetTopicAttributesCommand should be called once');
        const setAttrParams = commandCalls['SetTopicAttributesCommand'][0];
        const policy = JSON.parse(setAttrParams.AttributeValue);
        const principal = policy.Statement[0].Principal.AWS;
        assert(Array.isArray(principal), 'Principal should be array when multiple accounts');
        assert(principal.includes('arn:aws:iam::123456789012:root'));
        assert(principal.includes('arn:aws:iam::210987654321:root'));
        // Verify S3 publish permission is present for bucket notifications
        const s3Stmt = policy.Statement.find(s => s.Sid === 'AllowS3BucketPublish');
        assert(s3Stmt, 'S3 publish statement missing');
        assert.strictEqual(s3Stmt.Principal.Service, 's3.amazonaws.com');
        assert.strictEqual(s3Stmt.Condition.StringEquals['aws:SourceAccount'], '111111111111');
        assert.strictEqual(s3Stmt.Condition.ArnLike['aws:SourceArn'], 'arn:aws:s3:*:*:my-bucket');
    });

    it('falls back to legacy open policy when trustedAccountIds not provided', async () => {
        // Clear require cache to get fresh module
        delete require.cache[require.resolve('../../lib')];
        const lib = require('../../lib');

        const context = buildContext({ bucket: 'my-bucket', region: 'us-east-1' });

        await lib.registerWebhook(context, { topicPrefix: 'ObjectRemoved_', eventPrefix: 's3:ObjectRemoved:', eventType: 's3:ObjectRemoved:*' });

        assert(commandCalls['SetTopicAttributesCommand'], 'SetTopicAttributesCommand not called');
        const setAttrParams = commandCalls['SetTopicAttributesCommand'][0];
        const policy = JSON.parse(setAttrParams.AttributeValue);
        const principals = policy.Statement.map(s => s.Principal.AWS);
        assert(principals.includes('*'), 'Legacy policy should remain public');
    });

    it('calls setTopicAttributes with correct policy when trustedAccountIds is passed', async () => {
        // Clear require cache to get fresh module
        delete require.cache[require.resolve('../../lib')];
        const lib = require('../../lib');

        const context = buildContext({
            bucket: 'my-bucket',
            region: 'us-east-1',
            trustedAccountIds: '123456789012, 210987654321'
        });

        await lib.registerWebhook(context, {
            topicPrefix: 'ObjectCreated_',
            eventPrefix: 's3:ObjectCreated:',
            eventType: 's3:ObjectCreated:*',
            trustedAccountIds: context.properties.trustedAccountIds
        });

        // Verify setTopicAttributes is called with correct policy
        assert(commandCalls['SetTopicAttributesCommand'], 'SetTopicAttributesCommand not called');
        const setAttrParams = commandCalls['SetTopicAttributesCommand'][0];
        const policy = JSON.parse(setAttrParams.AttributeValue);
        const principal = policy.Statement[0].Principal.AWS;
        assert(Array.isArray(principal), 'Principal should be an array');
        assert(principal.includes('arn:aws:iam::123456789012:root'), 'Policy does not include trusted account 123456789012');
        assert(principal.includes('arn:aws:iam::210987654321:root'), 'Policy does not include trusted account 210987654321');
        const s3Stmt2 = policy.Statement.find(s => s.Sid === 'AllowS3BucketPublish');
        assert(s3Stmt2, 'S3 publish statement missing in trusted policy');
        assert.strictEqual(s3Stmt2.Principal.Service, 's3.amazonaws.com');
        assert.strictEqual(s3Stmt2.Condition.StringEquals['aws:SourceAccount'], '111111111111');
        assert.strictEqual(s3Stmt2.Condition.ArnLike['aws:SourceArn'], 'arn:aws:s3:*:*:my-bucket');
    });
});
