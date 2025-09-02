'use strict';

const assert = require('assert');
const sinon = require('sinon');

// We will proxy-require the commons after stubbing AWS SDK.
const AWS = require('aws-sdk');
const fs = require('fs');
let AWS_LOCAL;
if (fs.existsSync(require('path').join(__dirname, '../../src/appmixer/aws/node_modules/aws-sdk'))) {
    AWS_LOCAL = require('../../src/appmixer/aws/node_modules/aws-sdk');
}

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

// Stubs container reused per test.
let snsStub;
let s3Stub;
let kmsStub;

function resetStubs() {
    snsStub = {
        createTopic: sinon.stub(),
        setTopicAttributes: sinon.stub(),
        subscribe: sinon.stub(),
        confirmSubscription: sinon.stub()
    };
    s3Stub = {
        getBucketNotificationConfiguration: sinon.stub(),
        putBucketNotificationConfiguration: sinon.stub(),
        listObjectVersions: sinon.stub()
    };
    kmsStub = {
        describeKey: sinon.stub().returns({ promise: () => Promise.resolve({ KeyMetadata: { KeyId: 'mock-key-id' } }) }),
        listKeyPolicies: sinon.stub().returns({ promise: () => Promise.resolve({ PolicyNames: ['default'] }) }),
        getKeyPolicy: sinon.stub().returns({ promise: () => Promise.resolve({ Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                { Effect: 'Allow', Principal: { AWS: 'arn:aws:iam::111111111111:root' }, Action: 'kms:*', Resource: '*' },
                { Effect: 'Allow', Principal: { Service: 's3.amazonaws.com' }, Action: ['kms:Decrypt', 'kms:GenerateDataKey*'], Resource: '*' }
            ]
        }) }) })
    };

    // Stub both root-level and connector-local aws-sdk instances to avoid real network calls.
    // AWS_LOCAL may be undefined in CI (no local node_modules). Only stub defined objects.
    [AWS, AWS_LOCAL].forEach(A => {
        if (!A) return; // skip when connector-local aws-sdk isn't installed
        sinon.stub(A, 'SNS').callsFake(() => snsStub);
        sinon.stub(A, 'S3').callsFake(() => s3Stub);
        sinon.stub(A, 'Lambda').callsFake(() => ({ }));
        sinon.stub(A, 'KMS').callsFake(() => kmsStub);
    });
}

function restoreStubs() {
    sinon.restore();
}

describe('aws-commons registerWebhook security options', () => {

    afterEach(() => {
        restoreStubs();
    });

    it('creates encrypted topic with restrictive policy when kmsMasterKeyId and trustedAccountIds provided', async () => {
        resetStubs();
        const createResp = { TopicArn: 'arn:aws:sns:us-east-1:111111111111:topic1' };
        snsStub.createTopic.returns({ promise: () => Promise.resolve(createResp) });
        snsStub.setTopicAttributes.returns({ promise: () => Promise.resolve() });
        snsStub.subscribe.returns({ promise: () => Promise.resolve({ SubscriptionArn: 'sub-arn' }) });

        s3Stub.getBucketNotificationConfiguration.returns({
            promise: () => Promise.resolve({ TopicConfigurations: [] })
        });
        s3Stub.putBucketNotificationConfiguration.returns({ promise: () => Promise.resolve() });

        const commons = require('../../src/appmixer/aws/aws-commons');

        const context = buildContext({ bucket: 'my-bucket', region: 'us-east-1', kmsMasterKeyId: 'alias/my-key', trustedAccountIds: '123456789012, 210987654321' });

        await commons.registerWebhook(context, { topicPrefix: 'ObjectCreated_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: context.properties.kmsMasterKeyId, trustedAccountIds: context.properties.trustedAccountIds });

        // Verify createTopic got encryption attribute
        assert(snsStub.createTopic.calledOnce, 'createTopic not called');
        const params = snsStub.createTopic.firstCall.args[0];
        assert.strictEqual(params.Attributes.KmsMasterKeyId, 'alias/my-key');

        // Verify restrictive policy principal list contains normalized root ARNs
        assert(snsStub.setTopicAttributes.calledOnce, 'setTopicAttributes not called');
        const policy = JSON.parse(snsStub.setTopicAttributes.firstCall.args[0].AttributeValue);
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
        assert.strictEqual(s3Stmt.Condition.StringEquals['aws:SourceAccount'], '111111111111');
        assert(s3Stmt.Condition.ArnLike['aws:SourceArn'].includes('my-bucket'));
    });

    it('falls back to legacy open policy when trustedAccountIds not provided', async () => {
        resetStubs();
        const createResp = { TopicArn: 'arn:aws:sns:us-east-1:111111111111:topic2' };
        snsStub.createTopic.returns({ promise: () => Promise.resolve(createResp) });
        snsStub.setTopicAttributes.returns({ promise: () => Promise.resolve() });
        snsStub.subscribe.returns({ promise: () => Promise.resolve({ SubscriptionArn: 'sub-arn' }) });

        s3Stub.getBucketNotificationConfiguration.returns({
            promise: () => Promise.resolve({ TopicConfigurations: [] })
        });
        s3Stub.putBucketNotificationConfiguration.returns({ promise: () => Promise.resolve() });

        const commons = require('../../src/appmixer/aws/aws-commons');

        const context = buildContext({ bucket: 'my-bucket', region: 'us-east-1' });

        await commons.registerWebhook(context, { topicPrefix: 'ObjectRemoved_', eventPrefix: 's3:ObjectRemoved:', eventType: 's3:ObjectRemoved:*' });

        const policy = JSON.parse(snsStub.setTopicAttributes.firstCall.args[0].AttributeValue);
        const principals = policy.Statement.map(s => s.Principal.AWS);
        assert(principals.includes('*'), 'Legacy policy should remain public');
    });

    it('calls setTopicAttributes with correct policy when trustedAccountIds is passed', async () => {
        resetStubs();
        const createResp = { TopicArn: 'arn:aws:sns:us-east-1:111111111111:topic3' };
        snsStub.createTopic.returns({ promise: () => Promise.resolve(createResp) });
        snsStub.setTopicAttributes.returns({ promise: () => Promise.resolve() });
        snsStub.subscribe.returns({ promise: () => Promise.resolve({ SubscriptionArn: 'sub-arn' }) });

        s3Stub.getBucketNotificationConfiguration.returns({
            promise: () => Promise.resolve({ TopicConfigurations: [] })
        });
        s3Stub.putBucketNotificationConfiguration.returns({ promise: () => Promise.resolve() });

        const commons = require('../../src/appmixer/aws/aws-commons');

        const context = buildContext({
            bucket: 'my-bucket',
            region: 'us-east-1',
            trustedAccountIds: '123456789012, 210987654321'
        });

        await commons.registerWebhook(context, {
            topicPrefix: 'ObjectCreated_',
            eventPrefix: 's3:ObjectCreated:',
            eventType: 's3:ObjectCreated:*',
            trustedAccountIds: context.properties.trustedAccountIds
        });

        // Verify setTopicAttributes is called with correct policy
        assert(snsStub.setTopicAttributes.calledOnce, 'setTopicAttributes not called');
        const policy = JSON.parse(snsStub.setTopicAttributes.firstCall.args[0].AttributeValue);
        const principal = policy.Statement[0].Principal.AWS;
        assert(Array.isArray(principal), 'Principal should be an array');
        assert(principal.includes('arn:aws:iam::123456789012:root'), 'Policy does not include trusted account 123456789012');
        assert(principal.includes('arn:aws:iam::210987654321:root'), 'Policy does not include trusted account 210987654321');
        const s3Stmt2 = policy.Statement.find(s => s.Sid === 'AllowS3BucketPublish');
        assert(s3Stmt2, 'S3 publish statement missing in trusted policy');
        assert.strictEqual(s3Stmt2.Principal.Service, 's3.amazonaws.com');
        assert.strictEqual(s3Stmt2.Condition.StringEquals['aws:SourceAccount'], '111111111111');
        assert.strictEqual(s3Stmt2.Condition.ArnLike['aws:SourceArn'], 'arn:aws:s3:*:*:my-bucket');
        assert(s3Stmt2.Condition.ArnLike['aws:SourceArn'].includes('my-bucket'));
    });
});
