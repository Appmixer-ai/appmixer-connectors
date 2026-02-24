const assert = require('assert');
const sinon = require('sinon');

const GetDocumentSummary = require('../../core/GetDocumentSummary/GetDocumentSummary');

describe('GetDocumentSummary Component', function() {
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
                await GetDocumentSummary.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });

        it('should throw CancelError when documentId is empty string', async () => {
            context.messages.in.content = { documentId: '' };

            try {
                await GetDocumentSummary.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });

        it('should throw CancelError when documentId is null', async () => {
            context.messages.in.content = { documentId: null };

            try {
                await GetDocumentSummary.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });

        it('should throw CancelError when documentId is undefined', async () => {
            context.messages.in.content = { documentId: undefined };

            try {
                await GetDocumentSummary.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
            }
        });
    });

    describe('API Request Parameters', () => {
        it('should call API with correct HTTP method', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: { summary: 'Test summary' } });

            await GetDocumentSummary.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.method, 'GET');
        });

        it('should call API with correct URL', async () => {
            context.messages.in.content = { documentId: 'doc-456' };
            context.httpRequest.resolves({ data: { summary: 'Test summary' } });

            await GetDocumentSummary.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.url, 'https://api.ragie.ai/documents/doc-456/summary');
        });

        it('should include correct document ID in URL', async () => {
            const testDocId = 'my-unique-document-id-xyz';
            context.messages.in.content = { documentId: testDocId };
            context.httpRequest.resolves({ data: { summary: 'Test' } });

            await GetDocumentSummary.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(
                callArgs.url,
                `https://api.ragie.ai/documents/${testDocId}/summary`
            );
        });

        it('should include authorization header with API key', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: { summary: 'Test' } });

            await GetDocumentSummary.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Authorization'], 'Bearer test-api-key');
        });

        it('should use different API key in authorization header', async () => {
            context.auth.apiKey = 'custom-test-key-12345';
            context.messages.in.content = { documentId: 'doc-789' };
            context.httpRequest.resolves({ data: { summary: 'Test' } });

            await GetDocumentSummary.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Authorization'], 'Bearer custom-test-key-12345');
        });
    });

    describe('Response Handling', () => {
        it('should return JSON response from API', async () => {
            context.messages.in.content = { documentId: 'doc-123' };

            const mockResponse = {
                'Document Id': 'doc-123',
                'Summary': 'This is a document summary.'
            };

            context.httpRequest.resolves({ data: mockResponse });

            await GetDocumentSummary.receive(context);

            assert(context.sendJson.called);
            const callArgs = context.sendJson.firstCall.args;
            assert.deepStrictEqual(callArgs[0], mockResponse);
            assert.strictEqual(callArgs[1], 'out');
        });

        it('should call httpRequest exactly once', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: { summary: 'Test' } });

            await GetDocumentSummary.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1);
        });

        it('should call sendJson exactly once', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: { summary: 'Test' } });

            await GetDocumentSummary.receive(context);

            assert.strictEqual(context.sendJson.callCount, 1);
        });

        it('should handle empty response data', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: {} });

            await GetDocumentSummary.receive(context);

            assert(context.sendJson.called);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], {});
        });

        it('should handle response with multiple properties', async () => {
            context.messages.in.content = { documentId: 'doc-123' };

            const mockResponse = {
                'Document Id': 'doc-123',
                'Summary': 'A comprehensive summary',
                'Status': 'ready',
                'Created At': '2025-01-01T00:00:00Z',
                'Metadata': { key: 'value' }
            };

            context.httpRequest.resolves({ data: mockResponse });

            await GetDocumentSummary.receive(context);

            const callArgs = context.sendJson.firstCall.args[0];
            assert.deepStrictEqual(callArgs, mockResponse);
            assert(callArgs['Document Id']);
            assert(callArgs['Summary']);
            assert(callArgs['Status']);
        });

        it('should send response to "out" port', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.resolves({ data: { summary: 'Test' } });

            await GetDocumentSummary.receive(context);

            const callArgs = context.sendJson.firstCall.args;
            assert.strictEqual(callArgs[1], 'out');
        });
    });

    describe('Error Scenarios', () => {
        it('should propagate API errors from httpRequest', async () => {
            context.messages.in.content = { documentId: 'doc-123' };

            const apiError = new Error('API Error: Document not found');
            context.httpRequest.rejects(apiError);

            try {
                await GetDocumentSummary.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert.strictEqual(error.message, 'API Error: Document not found');
            }
        });

        it('should not call sendJson if httpRequest fails', async () => {
            context.messages.in.content = { documentId: 'doc-123' };
            context.httpRequest.rejects(new Error('API Error'));

            try {
                await GetDocumentSummary.receive(context);
            } catch (e) {
                // Expected error
            }

            assert(!context.sendJson.called);
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete flow with valid input', async () => {
            context.messages.in.content = { documentId: 'integration-test-doc' };

            const mockResponse = {
                'Document Id': 'integration-test-doc',
                'Summary': 'Integration test summary'
            };

            context.httpRequest.resolves({ data: mockResponse });

            await GetDocumentSummary.receive(context);

            // Verify httpRequest was called correctly
            assert.strictEqual(context.httpRequest.callCount, 1);
            const requestArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(requestArgs.method, 'GET');
            assert.strictEqual(requestArgs.url, 'https://api.ragie.ai/documents/integration-test-doc/summary');
            assert.strictEqual(requestArgs.headers['Authorization'], 'Bearer test-api-key');

            // Verify sendJson was called correctly
            assert.strictEqual(context.sendJson.callCount, 1);
            const responseArgs = context.sendJson.firstCall.args;
            assert.deepStrictEqual(responseArgs[0], mockResponse);
            assert.strictEqual(responseArgs[1], 'out');
        });
    });
});
