const assert = require('assert');
const sinon = require('sinon');

const PatchDocumentMetadata = require('../../core/PatchDocumentMetadata/PatchDocumentMetadata');

describe('PatchDocumentMetadata Component', function() {
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

    describe('Input Validation - DocumentId', () => {
        it('should throw CancelError when documentId is missing', async () => {
            context.messages.in.content = { metadata: {} };

            try {
                await PatchDocumentMetadata.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });

        it('should throw CancelError when documentId is empty string', async () => {
            context.messages.in.content = { documentId: '', metadata: {} };

            try {
                await PatchDocumentMetadata.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });

        it('should throw CancelError when documentId is null', async () => {
            context.messages.in.content = { documentId: null, metadata: {} };

            try {
                await PatchDocumentMetadata.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Document ID is required!');
            }
        });
    });

    describe('JSON Validation - Metadata String', () => {
        it('should parse valid JSON string metadata', async () => {
            const validJsonMetadata = '{"key": "value", "number": 123}';
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: validJsonMetadata
            };

            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            // Verify httpRequest was called with parsed metadata
            const callArgs = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(callArgs.data.metadata, { key: 'value', number: 123 });
        });

        it('should throw CancelError for invalid JSON string', async () => {
            const invalidJsonMetadata = '{"key": "value", invalid json}';
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: invalidJsonMetadata
            };

            try {
                await PatchDocumentMetadata.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Metadata must be valid JSON!');
            }
        });

        it('should throw CancelError for malformed JSON with unclosed bracket', async () => {
            const malformedJson = '{"key": "value"';
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: malformedJson
            };

            try {
                await PatchDocumentMetadata.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Metadata must be valid JSON!');
            }
        });

        it('should throw CancelError for malformed JSON with trailing comma', async () => {
            const malformedJson = '{"key": "value",}';
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: malformedJson
            };

            try {
                await PatchDocumentMetadata.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Metadata must be valid JSON!');
            }
        });

        it('should throw CancelError for single quotes instead of double quotes', async () => {
            const invalidJson = "{'key': 'value'}";
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: invalidJson
            };

            try {
                await PatchDocumentMetadata.receive(context);
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Metadata must be valid JSON!');
            }
        });

        it('should handle complex nested JSON', async () => {
            const complexJson = '{"user": {"name": "John", "age": 30}, "tags": ["a", "b"], "active": true}';
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: complexJson
            };

            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            const expectedMetadata = {
                user: { name: 'John', age: 30 },
                tags: ['a', 'b'],
                active: true
            };
            assert.deepStrictEqual(callArgs.data.metadata, expectedMetadata);
        });

        it('should handle empty JSON object', async () => {
            const emptyJson = '{}';
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: emptyJson
            };

            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(callArgs.data.metadata, {});
        });

        it('should handle JSON array at root level', async () => {
            const arrayJson = '["item1", "item2"]';
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: arrayJson
            };

            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(callArgs.data.metadata, ['item1', 'item2']);
        });
    });

    describe('JSON Validation - Metadata Object', () => {
        it('should accept object metadata without parsing', async () => {
            const objectMetadata = { key: 'value', nested: { inner: 'data' } };
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: objectMetadata
            };

            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(callArgs.data.metadata, objectMetadata);
        });

        it('should handle object with various data types', async () => {
            const objectMetadata = {
                stringVal: 'test',
                numberVal: 42,
                boolVal: true,
                nullVal: null,
                arrayVal: [1, 2, 3],
                objectVal: { nested: 'value' }
            };
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: objectMetadata
            };

            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(callArgs.data.metadata, objectMetadata);
        });
    });

    describe('API Request Parameters', () => {
        it('should call API with correct HTTP method (PATCH)', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{}'
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.method, 'PATCH');
        });

        it('should call API with correct URL', async () => {
            context.messages.in.content = {
                documentId: 'doc-456',
                metadata: '{}'
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.url, 'https://api.ragie.ai/documents/doc-456/metadata');
        });

        it('should include correct headers', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{}'
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.headers['Authorization'], 'Bearer test-api-key');
            assert.strictEqual(callArgs.headers['Content-Type'], 'application/json');
        });

        it('should include metadata in request body', async () => {
            const testMetadata = { key: 'value' };
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: JSON.stringify(testMetadata)
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(callArgs.data.metadata, testMetadata);
        });
    });

    describe('Async Parameter', () => {
        it('should include async=true in params when async is true', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{}',
                async: true
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.params.async, true);
        });

        it('should not include async param when async is false', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{}',
                async: false
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.params.async, undefined);
        });

        it('should not include async param when async is undefined', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{}'
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(callArgs.params.async, undefined);
        });
    });

    describe('Response Handling', () => {
        it('should send empty object response on success', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{"key": "value"}'
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.sendJson.firstCall.args;
            assert.deepStrictEqual(callArgs[0], {});
            assert.strictEqual(callArgs[1], 'out');
        });

        it('should call sendJson exactly once', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{"key": "value"}'
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            assert.strictEqual(context.sendJson.callCount, 1);
        });

        it('should send response to "out" port', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{"key": "value"}'
            };
            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const callArgs = context.sendJson.firstCall.args;
            assert.strictEqual(callArgs[1], 'out');
        });
    });

    describe('Error Scenarios', () => {
        it('should propagate API errors from httpRequest', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{"key": "value"}'
            };

            const apiError = new Error('API Error: Invalid metadata');
            context.httpRequest.rejects(apiError);

            try {
                await PatchDocumentMetadata.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert.strictEqual(error.message, 'API Error: Invalid metadata');
            }
        });

        it('should not call sendJson if validation fails', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{invalid json}'
            };

            try {
                await PatchDocumentMetadata.receive(context);
            } catch (e) {
                // Expected error
            }

            assert(!context.sendJson.called);
        });

        it('should not call httpRequest if validation fails', async () => {
            context.messages.in.content = {
                documentId: 'doc-123',
                metadata: '{invalid json}'
            };

            try {
                await PatchDocumentMetadata.receive(context);
            } catch (e) {
                // Expected error
            }

            assert(!context.httpRequest.called);
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete flow with JSON string metadata and async parameter', async () => {
            context.messages.in.content = {
                documentId: 'integration-doc',
                metadata: '{"author": "John", "version": 2}',
                async: true
            };

            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            // Verify httpRequest was called correctly
            assert.strictEqual(context.httpRequest.callCount, 1);
            const requestArgs = context.httpRequest.firstCall.args[0];
            assert.strictEqual(requestArgs.method, 'PATCH');
            assert.strictEqual(requestArgs.url, 'https://api.ragie.ai/documents/integration-doc/metadata');
            assert.deepStrictEqual(requestArgs.data.metadata, { author: 'John', version: 2 });
            assert.strictEqual(requestArgs.params.async, true);

            // Verify sendJson was called correctly
            assert.strictEqual(context.sendJson.callCount, 1);
            const responseArgs = context.sendJson.firstCall.args;
            assert.deepStrictEqual(responseArgs[0], {});
            assert.strictEqual(responseArgs[1], 'out');
        });

        it('should handle complete flow with object metadata', async () => {
            const metadata = { tags: ['important', 'review'], status: 'pending' };
            context.messages.in.content = {
                documentId: 'integration-doc-2',
                metadata: metadata
            };

            context.httpRequest.resolves({ data: {} });

            await PatchDocumentMetadata.receive(context);

            const requestArgs = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(requestArgs.data.metadata, metadata);
        });
    });
});
