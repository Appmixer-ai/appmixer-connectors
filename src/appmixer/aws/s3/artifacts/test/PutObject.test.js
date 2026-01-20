'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { Readable } = require('stream');
const testUtils = require('../../../../../../test/utils');

describe('AWS S3 PutObject component', () => {

    let context;
    let uploadDoneStub;
    let uploadParams;
    let lib;
    let libStorage;
    let PutObject;

    beforeEach(() => {
        // Clear module cache for fresh imports
        delete require.cache[require.resolve('../../lib')];
        delete require.cache[require.resolve('../../PutObject/PutObject')];
        delete require.cache[require.resolve('@aws-sdk/lib-storage')];

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

        // Mock file stream - return a proper readable stream
        const mockStream = new Readable({
            read() {
                this.push(null); // End the stream
            }
        });
        context.getFileReadStream = sinon.stub().resolves(mockStream);

        // Load and stub lib module
        lib = require('../../lib');
        sinon.stub(lib, 'init').returns({ s3: {} });

        // Load libStorage and stub Upload class
        libStorage = require('@aws-sdk/lib-storage');
        uploadParams = null;
        uploadDoneStub = sinon.stub().resolves({
            Key: 'test-file.txt',
            ETag: '"abc123"',
            Location: 'https://test-bucket.s3.amazonaws.com/test-file.txt'
        });
        sinon.stub(libStorage, 'Upload').callsFake(function(options) {
            uploadParams = options;
            return {
                done: uploadDoneStub
            };
        });

        // Now load the component (which will use our stubbed modules)
        PutObject = require('../../PutObject/PutObject');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('uploads file without ACL when ACL is not provided', async () => {
        await PutObject.receive(context);

        assert(libStorage.Upload.calledOnce, 'Upload should be instantiated once');
        assert.strictEqual(uploadParams.params.Bucket, 'test-bucket');
        assert.strictEqual(uploadParams.params.Key, 'test-file.txt');
        assert.strictEqual(uploadParams.params.ContentType, 'text/plain');
        assert(!uploadParams.params.ACL, 'ACL should not be set when not provided');
    });

    it('uploads file with ACL when ACL is provided', async () => {
        context.messages.in.content.acl = 'public-read';

        await PutObject.receive(context);

        assert.strictEqual(uploadParams.params.ACL, 'public-read');
    });

    it('configures multipart upload options when provided', async () => {
        context.messages.in.content.maxPartSize = 10; // 10 MB
        context.messages.in.content.concurrentParts = 5;

        await PutObject.receive(context);

        assert.strictEqual(uploadParams.partSize, 10 * 1048576);
        assert.strictEqual(uploadParams.queueSize, 5);
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
