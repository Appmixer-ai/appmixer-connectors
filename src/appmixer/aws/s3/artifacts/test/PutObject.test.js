'use strict';

const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../../test/utils');

// Load commons so we can stub its methods before loading component.
const commons = require('../../../aws-commons');

// Component under test.
const PutObject = require('../../PutObject/PutObject');

describe('AWS S3 PutObject component', () => {

    let context;
    let s3Mock;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = {
            in: {
                content: {
                    bucket: 'test-bucket',
                    key: 'test-file.txt',
                    fileId: 'file123',
                    contentType: 'text/plain'
                }
            }
        };
        context.properties = { region: 'us-east-1' };

        // Mock S3 upload
        s3Mock = {
            upload: sinon.stub().returns({
                promise: sinon.stub().resolves({
                    Key: 'test-file.txt',
                    ETag: '"abc123"',
                    Location: 'https://test-bucket.s3.amazonaws.com/test-file.txt'
                })
            })
        };

        // Mock commons.init to return our mocked S3
        sinon.stub(commons, 'init').returns({ s3: s3Mock });

        // Mock file stream
        context.getFileReadStream = sinon.stub().resolves({
            pipe: sinon.stub()
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('uploads file without ACL when ACL is not provided', async () => {
        await PutObject.receive(context);

        assert(s3Mock.upload.calledOnce, 'S3 upload should be called once');
        const uploadParams = s3Mock.upload.firstCall.args[0];

        assert.strictEqual(uploadParams.Bucket, 'test-bucket');
        assert.strictEqual(uploadParams.Key, 'test-file.txt');
        assert.strictEqual(uploadParams.ContentType, 'text/plain');
        assert(!uploadParams.ACL, 'ACL should not be set when not provided');
    });

    it('uploads file with ACL when ACL is provided', async () => {
        context.messages.in.content.acl = 'public-read';

        await PutObject.receive(context);

        const uploadParams = s3Mock.upload.firstCall.args[0];
        assert.strictEqual(uploadParams.ACL, 'public-read');
    });

    it('configures multipart upload options when provided', async () => {
        context.messages.in.content.maxPartSize = 10; // 10 MB
        context.messages.in.content.concurrentParts = 5;

        await PutObject.receive(context);

        const uploadOptions = s3Mock.upload.firstCall.args[1];
        assert.strictEqual(uploadOptions.partSize, 10 * 1048576);
        assert.strictEqual(uploadOptions.queueSize, 5);
    });

    it('returns correct output format', async () => {
        await PutObject.receive(context);

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const output = context.sendJson.firstCall.args[0];

        assert.strictEqual(output.Bucket, 'test-bucket');
        assert.strictEqual(output.Key, 'test-file.txt');
        assert.strictEqual(output.ETag, '"abc123"');
        assert.strictEqual(output.Location, 'https://test-bucket.s3.amazonaws.com/test-file.txt');
        assert.strictEqual(output.ContentType, 'text/plain');
    });

    it('throws error when bucket is missing', async () => {
        delete context.messages.in.content.bucket;

        try {
            await PutObject.receive(context);
            assert.fail('Should have thrown an error');
        } catch (err) {
            assert(err instanceof context.CancelError);
            assert(err.message.includes('Bucket is required'));
        }
    });

    it('throws error when key is missing', async () => {
        delete context.messages.in.content.key;

        try {
            await PutObject.receive(context);
            assert.fail('Should have thrown an error');
        } catch (err) {
            assert(err instanceof context.CancelError);
            assert(err.message.includes('Object Key is required'));
        }
    });

    it('throws error when fileId is missing', async () => {
        delete context.messages.in.content.fileId;

        try {
            await PutObject.receive(context);
            assert.fail('Should have thrown an error');
        } catch (err) {
            assert(err instanceof context.CancelError);
            assert(err.message.includes('File ID is required'));
        }
    });
});
