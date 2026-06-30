const assert = require('assert');
const sinon = require('sinon');

const DeleteDocument = require('../../core/DeleteDocument/DeleteDocument');

describe('DeleteDocument Component', function() {
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
                await DeleteDocument.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });

        it('should throw CancelError when documentId is empty string', async () => {
            context.messages.in.content = { documentId: '' };

            try {
                await DeleteDocument.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });

        it('should throw CancelError when documentId is null', async () => {
            context.messages.in.content = { documentId: null };

            try {
                await DeleteDocument.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });

        it('should throw CancelError when documentId is undefined', async () => {
            context.messages.in.content = { documentId: undefined };

            try {
                await DeleteDocument.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });
    });

    describe('API Request Parameters', () => {
        it('should call API with correct HTTP method (DELETE)', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.method, 'DELETE');
        });

        it('should call API with correct URL', async () => {
            context.messages.in.content = { documentId: 'doc-456' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.url, 'https://api.ragie.ai/documents/doc-456');
        });

        it('should include correct document ID in URL', async () => {
            const testDocId = 'my-unique-document-id-xyz';
            context.messages.in.content = { documentId: testDocId };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(
                callArgs.url,
                `https://api.ragie.ai/documents/${testDocId}`
            );
        });

        it('should include authorization header with API key', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Authorization'], 'Bearer test-api-key');
        });

        it('should use different API key in authorization header', async () => {
            context.auth.apiKey = 'custom-api-key-xyz';
            context.messages.in.content = { documentId: 'doc-789' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Authorization'], 'Bearer custom-api-key-xyz');
        });

        it('should include Accept header set to application/json', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Accept'], 'application/json');
        });

        it('should only include necessary headers', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            const headerKeys = Object.keys(callArgs.headers);
            assert.strictEqual(headerKeys.length, 2);
            assert(headerKeys.includes('Authorization'));
            assert(headerKeys.includes('Accept'));
        });
    });

    describe('Response Handling', () => {
        it('should send empty object response on success', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            assert(context.sendJson.called);
            const callArgs = context.sendJson.firstCall.args;
            assert.deepStrictEqual(callArgs[0], {});
            assert.strictEqual(callArgs[1], 'out');
        });

        it('should call httpRequest exactly once', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
        });

        it('should call sendJson exactly once', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            assert.strictEqual(context.sendJson.callCount, 1);
        });

        it('should send response to "out" port', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const callArgs = context.sendJson.firstCall.args;
            assert.strictEqual(callArgs[1], 'out');
        });

        it('should return consistent empty object for all successful deletions', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            // Capture first response before resetting
            const firstResponse = context.sendJson.firstCall.args[0];

            // Delete another document
            context.messages.in.content = { documentId: 'doc-456' };
            context.httpRequest.reset();
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            // Capture second response (sendJson not reset, so secondCall exists)
            const secondResponse = context.sendJson.secondCall.args[0];

            // Both responses should be identical empty objects
            assert.deepStrictEqual(firstResponse, {});
            assert.deepStrictEqual(secondResponse, {});
            assert.deepStrictEqual(firstResponse, secondResponse);
        });
    });

    describe('Error Scenarios', () => {
        it('should propagate API errors from httpRequest', async () => {
            context.messages.in.content = { documentId: 'doc-123' };

            const apiError = new Error('API Error: Document not found');
            context.httpRequest.rejects(apiError);

            try {
                await DeleteDocument.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert.strictEqual(error.message, 'API Error: Document not found');
            }
        });

        it('should not call sendJson if httpRequest fails', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.rejects(new Error('API Error'));

            try {
                await DeleteDocument.receive(context);
            } catch (e) {
                // Expected error
            }

            assert(!context.sendJson.called);
        });

        it('should propagate network errors', async () => {
            context.messages.in.content = { documentId: 'doc-123' };

            const networkError = new Error('Network timeout');
            context.httpRequest.rejects(networkError);

            try {
                await DeleteDocument.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert.strictEqual(error.message, 'Network timeout');
            }
        });

        it('should propagate 404 not found errors', async () => {
            context.messages.in.content = { documentId: 'non-existent' };

            const notFoundError = new Error('404: Document not found');
            context.httpRequest.rejects(notFoundError);

            try {
                await DeleteDocument.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert.strictEqual(error.message, '404: Document not found');
            }
        });
    });

    describe('Multiple Operations', () => {
        it('should handle sequential deletions correctly', async () => {
            // First deletion
            context.messages.in.content = { documentId: 'doc-1' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const firstUrl = context.httpRequest.firstCall.args[0].url;
            assert.strictEqual(firstUrl, 'https://api.ragie.ai/documents/doc-1');

            // Second deletion
            context.httpRequest.reset();
            context.sendJson.reset();
            context.messages.in.content = { documentId: 'doc-2' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const secondUrl = context.httpRequest.firstCall.args[0].url;
            assert.strictEqual(secondUrl, 'https://api.ragie.ai/documents/doc-2');

            // Third deletion
            context.httpRequest.reset();
            context.sendJson.reset();
            context.messages.in.content = { documentId: 'doc-3' };
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const thirdUrl = context.httpRequest.firstCall.args[0].url;
            assert.strictEqual(thirdUrl, 'https://api.ragie.ai/documents/doc-3');
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete flow for deleting a document', async () => {
            context.messages.in.content = { documentId: 'integration-test-doc' };

            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            // Verify httpRequest was called correctly
            assert.strictEqual(context.httpRequest.callCount, 1);
            const requestArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(requestArgs.method, 'DELETE');
            assert.strictEqual(requestArgs.url, 'https://api.ragie.ai/documents/integration-test-doc');
            assert.strictEqual(requestArgs.headers['Authorization'], 'Bearer test-api-key');
            assert.strictEqual(requestArgs.headers['Accept'], 'application/json');

            // Verify sendJson was called correctly
            assert.strictEqual(context.sendJson.callCount, 1);
            const responseArgs = context.sendJson.firstCall.args;
            assert.deepStrictEqual(responseArgs[0], {});
            assert.strictEqual(responseArgs[1], 'out');
        });

        it('should handle document ID with special characters', async () => {
            const specialDocId = 'doc-123_abc.456';
            context.messages.in.content = { documentId: specialDocId };

            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);

            const requestArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(
                requestArgs.url,
                `https://api.ragie.ai/documents/${specialDocId}`
            );
        });
    });

    describe('Idempotency', () => {
        it('should return the same response for the same document ID', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            // First call
            await DeleteDocument.receive(context);
            const firstResponse = context.sendJson.firstCall.args[0];

            // Second call with same document ID
            context.httpRequest.reset();
            context.sendJson.reset();
            context.httpRequest.resolves({ data: {} });

            await DeleteDocument.receive(context);
            const secondResponse = context.sendJson.firstCall.args[0];

            // Both responses should be identical
            assert.deepStrictEqual(firstResponse, secondResponse);
        });
    });
});
