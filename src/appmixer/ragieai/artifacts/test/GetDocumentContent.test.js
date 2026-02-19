const assert = require('assert');
const sinon = require('sinon');

const GetDocumentContent = require('../../core/GetDocumentContent/GetDocumentContent');

describe('GetDocumentContent Component', function() {
    let context;

    beforeEach(() => {
        context = {
            auth: {
                apiKey: 'test-api-key'
            },
            messages: {
                in: {
                    content: {}
                }
            },
            httpRequest: sinon.stub(),
            sendJson: sinon.stub().returns({ status: 'success' }),
            saveFileStream: sinon.stub().resolves({ fileId: 'file-123', length: 1024 }),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Input Validation', () => {
        it('should throw CancelError when documentId is missing', async () => {
            context.messages.in.content = {};

            try {
                await GetDocumentContent.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document Id is required!');
            }
        });

        it('should throw CancelError when documentId is empty string', async () => {
            context.messages.in.content = { documentId: '' };

            try {
                await GetDocumentContent.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document Id is required!');
            }
        });

        it('should throw CancelError when documentId is null', async () => {
            context.messages.in.content = { documentId: null };

            try {
                await GetDocumentContent.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document Id is required!');
            }
        });
    });

    describe('JSON Content Request', () => {
        it('should request JSON content with default media type', async () => {
            context.messages.in.content = { documentId: 'doc-123' };

            const mockResponse = {
                status: 'ready',
                id: 'doc-123',
                content: 'Document content here'
            };

            context.httpRequest.resolves({ data: mockResponse });

            await GetDocumentContent.receive(context);

            // Verify httpRequest was called with correct parameters
            assert(context.httpRequest.called);
            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.method, 'GET');
            assert.strictEqual(callArgs.url, 'https://api.ragie.ai/documents/doc-123/content');
            assert.strictEqual(callArgs.headers['Authorization'], 'Bearer test-api-key');
            assert(!callArgs.headers['Accept']); // No Accept header for default JSON
            assert.deepStrictEqual(callArgs.params, {});

            // Verify sendJson was called with the response
            assert(context.sendJson.called);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], mockResponse);
            assert.strictEqual(context.sendJson.firstCall.args[1], 'out');
        });

        it('should request JSON content with application/json media type', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                mediaType: 'application/json'
            };

            const mockResponse = {
                status: 'ready',
                id: 'doc-123',
                metadata: { key: 'value' }
            };

            context.httpRequest.resolves({ data: mockResponse });

            await GetDocumentContent.receive(context);

            // Verify httpRequest was called with correct Accept header
            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Accept'], 'application/json');

            // Verify sendJson was called with the response (JSON path, not file path)
            assert(context.sendJson.called);
            assert(!context.saveFileStream.called);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], mockResponse);
        });
    });

    describe('Binary/Stream Content Request - Download Flag', () => {
        it('should include download parameter and return JSON when mediaType is not specified', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                download: true
            };

            const mockResponse = {
                status: 'ready',
                id: 'doc-123',
                content: 'Document content here'
            };
            context.httpRequest.resolves({ data: mockResponse });

            await GetDocumentContent.receive(context);

            // Verify httpRequest was called and download param was passed
            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.method, 'GET');
            assert.strictEqual(callArgs.url, 'https://api.ragie.ai/documents/doc-123/content');
            assert.strictEqual(callArgs.params.download, 'true');
            assert(!callArgs.encoding); // download no longer forces binary

            // Verify saveFileStream was not called (JSON path)
            assert(!context.saveFileStream.called);

            // Verify sendJson was called with the JSON response
            assert(context.sendJson.called);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], mockResponse);
            assert.strictEqual(context.sendJson.firstCall.args[1], 'out');
        });

        it('should handle download=false without binary encoding', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                download: false
            };

            const mockResponse = { status: 'ready', id: 'doc-123' };
            context.httpRequest.resolves({ data: mockResponse });

            await GetDocumentContent.receive(context);

            // Verify httpRequest does not have binary encoding
            const callArgs = context.httpRequest.firstCall.args[0];
            assert(!callArgs.encoding);
            assert.strictEqual(callArgs.params.download, undefined);

            // Verify saveFileStream was not called
            assert(!context.saveFileStream.called);

            // Verify sendJson was called with response (JSON path)
            assert(context.sendJson.called);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], mockResponse);
        });
    });

    describe('Binary/Stream Content Request - Non-JSON Media Type', () => {
        it('should handle audio/mpeg media type with binary encoding', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                mediaType: 'audio/mpeg'
            };

            const mockBinaryData = Buffer.from([0xFF, 0xFB, 0x90, 0x00]); // MP3 header
            context.httpRequest.resolves({ data: mockBinaryData });

            await GetDocumentContent.receive(context);

            // Verify httpRequest was called with binary encoding
            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Accept'], 'audio/mpeg');
            assert.strictEqual(callArgs.encoding, 'binary');

            // Verify saveFileStream was called
            assert(context.saveFileStream.called);

            // Verify sendJson was called with fileId
            assert(context.sendJson.called);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { fileId: 'file-123' });
        });

        it('should handle video/mp4 media type with binary encoding', async () => {
            context.messages.in.content = {
                documentId: 'doc-456',
                mediaType: 'video/mp4'
            };

            const mockBinaryData = Buffer.from([0x00, 0x00, 0x00, 0x18]); // MP4 header
            context.httpRequest.resolves({ data: mockBinaryData });

            await GetDocumentContent.receive(context);

            // Verify httpRequest was called with binary encoding
            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Accept'], 'video/mp4');
            assert.strictEqual(callArgs.encoding, 'binary');

            // Verify saveFileStream was called with document-specific filename
            assert(context.saveFileStream.called);
            const fileCallArgs = context.saveFileStream.firstCall.args;
            assert.strictEqual(fileCallArgs[0], 'document-doc-456-content');

            // Verify sendJson was called with fileId
            assert(context.sendJson.called);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { fileId: 'file-123' });
        });

        it('should handle text/plain media type with binary encoding', async () => {
            context.messages.in.content = {
                documentId: 'doc-789',
                mediaType: 'text/plain'
            };

            const mockBinaryData = Buffer.from('Plain text content');
            context.httpRequest.resolves({ data: mockBinaryData });

            await GetDocumentContent.receive(context);

            // Verify httpRequest was called with binary encoding
            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Accept'], 'text/plain');
            assert.strictEqual(callArgs.encoding, 'binary');

            // Verify saveFileStream was called
            assert(context.saveFileStream.called);

            // Verify sendJson was called with fileId (not JSON path)
            assert(context.sendJson.called);
            assert(!context.sendJson.firstCall.args[0].status);
            assert.strictEqual(context.sendJson.firstCall.args[0].fileId, 'file-123');
        });
    });

    describe('API Request Parameters', () => {
        it('should include authorization header with API key', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await GetDocumentContent.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Authorization'], 'Bearer test-api-key');
        });

        it('should use correct HTTP method (GET)', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await GetDocumentContent.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.method, 'GET');
        });

        it('should construct correct URL with document ID', async () => {
            context.messages.in.content = { documentId: 'my-document-id-12345' };
            context.httpRequest.resolves({ data: {} });

            await GetDocumentContent.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(
                callArgs.url,
                'https://api.ragie.ai/documents/my-document-id-12345/content'
            );
        });

        it('should include download parameter when download is true', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                download: true
            };
            context.httpRequest.resolves({ data: Buffer.from('test') });

            await GetDocumentContent.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.params.download, 'true');
        });

        it('should not include download parameter when download is false', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                download: false
            };
            context.httpRequest.resolves({ data: {} });

            await GetDocumentContent.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.params.download, undefined);
        });

        it('should not include download parameter when download is undefined', async () => {
            context.messages.in.content = {
                documentId: 'doc-123'
            };
            context.httpRequest.resolves({ data: {} });

            await GetDocumentContent.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.params.download, undefined);
        });
    });

    describe('Edge Cases', () => {
        it('should respect mediaType when download is also true (mediaType determines binary vs JSON)', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                mediaType: 'application/json',
                download: true
            };

            const mockResponse = {
                status: 'ready',
                id: 'doc-123',
                metadata: { key: 'value' }
            };
            context.httpRequest.resolves({ data: mockResponse });

            await GetDocumentContent.receive(context);

            // JSON path should be taken because mediaType === 'application/json'
            const callArgs = context.httpRequest.firstCall.args[0];
            assert(!callArgs.encoding);
            assert.strictEqual(callArgs.params.download, 'true');

            assert(!context.saveFileStream.called);
            assert(context.sendJson.called);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], mockResponse);
        });

        it('should handle saveFileStream with document ID in filename when mediaType is binary', async () => {
            context.messages.in.content = {
                documentId: 'unique-doc-id-xyz',
                mediaType: 'video/mp4'
            };

            const mockBinaryData = Buffer.from([0x00, 0x00, 0x00]);
            context.httpRequest.resolves({ data: mockBinaryData });

            await GetDocumentContent.receive(context);

            // Verify filename includes document ID
            const fileCallArgs = context.saveFileStream.firstCall.args;
            assert.strictEqual(fileCallArgs[0], 'document-unique-doc-id-xyz-content');
        });
    });
});
