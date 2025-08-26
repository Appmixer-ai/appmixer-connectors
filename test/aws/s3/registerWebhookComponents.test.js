'use strict';

const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils');

// Load commons so we can stub its methods before loading components.
const commons = require('../../../src/appmixer/aws/aws-commons');

// Components under test.
const NewObject = require('../../../src/appmixer/aws/s3/NewObject/NewObject');
const DeletedObject = require('../../../src/appmixer/aws/s3/DeletedObject/DeletedObject');
const UpdatedObject = require('../../../src/appmixer/aws/s3/UpdatedObject/UpdatedObject');

describe('AWS S3 trigger components registerWebhook integration', () => {

    let context;
    let registerStub;
    let unregisterStub;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.properties = { bucket: 'my-bucket', region: 'us-east-1' };
        registerStub = sinon.stub(commons, 'registerWebhook').resolves();
        unregisterStub = sinon.stub(commons, 'unregisterWebhook').resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    function assertSecurityPayload(payload, { kms, trusted }) {
        if (kms !== undefined) {
            assert.strictEqual(payload.kmsMasterKeyId, kms, 'kmsMasterKeyId mismatch');
        } else {
            assert(!('kmsMasterKeyId' in payload) || payload.kmsMasterKeyId === undefined, 'kmsMasterKeyId should be absent/undefined');
        }
        if (trusted !== undefined) {
            assert.strictEqual(payload.trustedAccountIds, trusted, 'trustedAccountIds mismatch');
        } else {
            assert(!('trustedAccountIds' in payload) || payload.trustedAccountIds === undefined, 'trustedAccountIds should be absent/undefined');
        }
    }

    describe('NewObject.start', () => {
        it('passes kmsMasterKeyId and trustedAccountIds when provided', async () => {
            context.properties.kmsMasterKeyId = 'alias/my-key';
            context.properties.trustedAccountIds = '123456789012,210987654321';

            await NewObject.start(context);

            assert(registerStub.calledOnce, 'registerWebhook not called');
            const args = registerStub.firstCall.args;
            assert.strictEqual(args[0], context, 'context arg mismatch');
            const payload = args[1];
            assert.deepStrictEqual(payload.topicPrefix, 'ObjectCreated_');
            assert.deepStrictEqual(payload.eventPrefix, 's3:ObjectCreated:');
            assert.deepStrictEqual(payload.eventType, 's3:ObjectCreated:*');
            assertSecurityPayload(payload, { kms: 'alias/my-key', trusted: '123456789012,210987654321' });
        });

        it('omits kmsMasterKeyId and trustedAccountIds when not provided (backwards compatibility)', async () => {
            await NewObject.start(context);
            const payload = registerStub.firstCall.args[1];
            assertSecurityPayload(payload, { });
        });
    });

    describe('DeletedObject.start', () => {
        it('passes security fields when provided', async () => {
            context.properties.kmsMasterKeyId = 'alias/other-key';
            context.properties.trustedAccountIds = '999999999999';
            await DeletedObject.start(context);
            const payload = registerStub.firstCall.args[1];
            assert.deepStrictEqual(payload.topicPrefix, 'ObjectRemoved_');
            assert.deepStrictEqual(payload.eventPrefix, 's3:ObjectRemoved:');
            assert.deepStrictEqual(payload.eventType, 's3:ObjectRemoved:*');
            assertSecurityPayload(payload, { kms: 'alias/other-key', trusted: '999999999999' });
        });

        it('works without security fields', async () => {
            await DeletedObject.start(context);
            const payload = registerStub.firstCall.args[1];
            assertSecurityPayload(payload, { });
        });
    });

    describe('UpdatedObject.start', () => {
        it('passes security fields when provided', async () => {
            context.properties.kmsMasterKeyId = 'alias/upd-key';
            context.properties.trustedAccountIds = '123456789012';
            await UpdatedObject.start(context);
            const payload = registerStub.firstCall.args[1];
            assert.deepStrictEqual(payload.topicPrefix, 'ObjectCreated_');
            assert.deepStrictEqual(payload.eventPrefix, 's3:ObjectCreated:');
            assert.deepStrictEqual(payload.eventType, 's3:ObjectCreated:*');
            assertSecurityPayload(payload, { kms: 'alias/upd-key', trusted: '123456789012' });
        });

        it('works without security fields', async () => {
            await UpdatedObject.start(context);
            const payload = registerStub.firstCall.args[1];
            assertSecurityPayload(payload, { });
        });
    });

    describe('stop()', () => {
        it('calls unregisterWebhook for each component', async () => {
            await NewObject.stop(context);
            await DeletedObject.stop(context);
            await UpdatedObject.stop(context);
            assert.strictEqual(unregisterStub.callCount, 3, 'unregisterWebhook should be called 3 times');
        });
    });
});
