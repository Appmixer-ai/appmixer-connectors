'use strict';

const assert = require('assert');
const sinon = require('sinon');
const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');

let AWS_LOCAL;
if (fs.existsSync(path.join(__dirname, '../../node_modules/aws-sdk'))) {
    AWS_LOCAL = require('../../node_modules/aws-sdk');
}

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

let snsStub; let s3Stub; let kmsStub;

function resetStubs() {
    // Restore all sinon stubs before creating new ones
    sinon.restore();

    snsStub = { createTopic: sinon.stub(), setTopicAttributes: sinon.stub(), subscribe: sinon.stub() };
    s3Stub = { getBucketNotificationConfiguration: sinon.stub(), putBucketNotificationConfiguration: sinon.stub() };
    kmsStub = { describeKey: sinon.stub(), listKeyPolicies: sinon.stub(), getKeyPolicy: sinon.stub() };

    // Stub the connector-local aws-sdk instance (aws-commons uses this)
    // If AWS_LOCAL is not available (e.g., in CI without local node_modules), stub the global AWS instead
    const awsToStub = AWS_LOCAL || AWS;
    sinon.stub(awsToStub, 'SNS').callsFake(() => snsStub);
    sinon.stub(awsToStub, 'S3').callsFake(() => s3Stub);
    sinon.stub(awsToStub, 'Lambda').callsFake(() => ({ }));
    sinon.stub(awsToStub, 'KMS').callsFake(() => kmsStub);
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

describe('aws-commons KMS validation', () => {

    beforeEach(() => {
        resetStubs();
    });

    afterEach(() => restoreStubs());

    after(() => restoreStubs());

    it('creates encrypted topic when kms key alias policy allows S3', async () => {
        // KMS success path stubs
        kmsStub.describeKey.returns({ promise: () => Promise.resolve({ KeyMetadata: { KeyId: '1234-uuid-key' } }) });
        kmsStub.listKeyPolicies.returns({ promise: () => Promise.resolve({ PolicyNames: ['default'] }) });
        kmsStub.getKeyPolicy.returns({ promise: () => Promise.resolve({ Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                { Sid: 'EnableRoot', Effect: 'Allow', Principal: { AWS: 'arn:aws:iam::111111111111:root' }, Action: 'kms:*', Resource: '*' },
                { Effect: 'Allow', Principal: { Service: 's3.amazonaws.com' }, Action: ['kms:Decrypt', 'kms:GenerateDataKey*'], Resource: '*' }
            ]
        }) }) });

        s3Stub.getBucketNotificationConfiguration.returns({
            promise: () => Promise.resolve({ TopicConfigurations: [] })
        });
        s3Stub.putBucketNotificationConfiguration.returns({ promise: () => Promise.resolve() });
        snsStub.createTopic.returns({ promise: () => Promise.resolve({ TopicArn: 'arn:aws:sns:us-east-1:111111111111:topicKms1' }) });
        snsStub.setTopicAttributes.returns({ promise: () => Promise.resolve() });
        snsStub.subscribe.returns({ promise: () => Promise.resolve({ SubscriptionArn: 'sub-arn' }) });

        const commons = require('../../aws-commons');
        const context = buildContext({ bucket: 'bucket-a', region: 'us-east-1' });

        await commons.registerWebhook(context, { topicPrefix: 'Obj_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'alias/my-key' });

        assert(snsStub.createTopic.calledOnce, 'createTopic not called');
        const params = snsStub.createTopic.firstCall.args[0];
        assert.strictEqual(params.Attributes.KmsMasterKeyId, 'alias/my-key');
    });

    it('rejects invalid kmsMasterKeyId format', async () => {
        s3Stub.getBucketNotificationConfiguration.returns({
            promise: () => Promise.resolve({ TopicConfigurations: [] })
        });
        const commons = require('../../aws-commons');
        const context = buildContext({ bucket: 'bkt', region: 'us-east-1' });
        await expectCancel(commons.registerWebhook(context, { topicPrefix: 'X_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'bad-format-key' }), 'kmsMasterKeyId format is invalid');
        assert.strictEqual(snsStub.createTopic.called, false, 'Should not attempt createTopic on invalid format');
    });

    it('rejects when describeKey fails', async () => {
        kmsStub.describeKey.returns({ promise: () => Promise.reject(new Error('NotFound')) });
        s3Stub.getBucketNotificationConfiguration.returns({
            promise: () => Promise.resolve({ TopicConfigurations: [] })
        });
        const commons = require('../../aws-commons');
        const context = buildContext({ bucket: 'bucket-a', region: 'us-east-1' });
        await expectCancel(commons.registerWebhook(context, { topicPrefix: 'Obj_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'alias/my-key' }), 'KMS key not found');
        assert.strictEqual(snsStub.createTopic.called, false, 'createTopic should not be called if describeKey fails');
    });

    it('rejects when key policy missing S3 statement', async () => {
        kmsStub.describeKey.returns({ promise: () => Promise.resolve({ KeyMetadata: { KeyId: 'key-uuid' } }) });
        kmsStub.listKeyPolicies.returns({ promise: () => Promise.resolve({ PolicyNames: ['default'] }) });
        kmsStub.getKeyPolicy.returns({ promise: () => Promise.resolve({ Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
                Effect: 'Allow',
                Principal: { AWS: 'arn:aws:iam::111111111111:root' },
                Action: 'kms:*',
                Resource: '*'
            }]
        }) }) });
        s3Stub.getBucketNotificationConfiguration.returns({
            promise: () => Promise.resolve({ TopicConfigurations: [] })
        });
        const commons = require('../../aws-commons');
        const context = buildContext({ bucket: 'bkt', region: 'us-east-1' });
        await expectCancel(commons.registerWebhook(context, { topicPrefix: 'T_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'alias/my-key' }), 'KMS key policy missing required S3 permissions');
    });

    it('rejects when key policy JSON invalid', async () => {
        kmsStub.describeKey.returns({ promise: () => Promise.resolve({ KeyMetadata: { KeyId: 'key-uuid' } }) });
        kmsStub.listKeyPolicies.returns({ promise: () => Promise.resolve({ PolicyNames: ['default'] }) });
        kmsStub.getKeyPolicy.returns({ promise: () => Promise.resolve({ Policy: '{not-json' }) });
        s3Stub.getBucketNotificationConfiguration.returns({
            promise: () => Promise.resolve({ TopicConfigurations: [] })
        });
        const commons = require('../../aws-commons');
        const context = buildContext({ bucket: 'bkt', region: 'us-east-1' });
        await expectCancel(commons.registerWebhook(context, { topicPrefix: 'T_', eventPrefix: 's3:ObjectCreated:', eventType: 's3:ObjectCreated:*', kmsMasterKeyId: 'alias/my-key' }), 'Unable to parse KMS key policy JSON');
    });
});
