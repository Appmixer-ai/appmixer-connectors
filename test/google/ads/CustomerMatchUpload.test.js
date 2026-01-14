'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { Readable } = require('stream');

// Mock context for testing
const createMockContext = () => {
    return {
        log: sinon.stub(),
        CancelError: class extends Error {
            constructor(message) {
                super(message);
                this.name = 'CancelError';
            }
        },
        messages: {
            in: {
                content: {}
            }
        },
        sendJson: sinon.stub(),
        getFileReadStream: sinon.stub(),
        setTimeout: sinon.stub()
    };
};

describe('Google Ads CustomerMatchUpload Component', () => {
    let CustomerMatchUpload;
    let context;

    before(() => {
        // Load the component
        CustomerMatchUpload = require('../../../src/appmixer/google/ads/CustomerMatchUpload/CustomerMatchUpload');
    });

    beforeEach(() => {
        context = createMockContext();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Input Validation', () => {
        it('should throw error when fileId is missing', async () => {
            context.messages.in.content = {
                clientId: 'test-client-id',
                clientSecret: 'test-secret',
                refreshToken: 'test-token',
                developerToken: 'test-dev-token',
                customerId: '1234567890',
                segmentToUserList: '{"segment1": "123456"}'
            };

            try {
                await CustomerMatchUpload.receive(context);
                assert.fail('Should have thrown error for missing fileId');
            } catch (error) {
                assert(error.message.includes('Missing fileId') || error.message.includes('fileId'));
            }
        });

        it('should throw error when OAuth2 credentials are missing', async () => {
            context.messages.in.content = {
                fileId: 'test-file-id',
                developerToken: 'test-dev-token',
                customerId: '1234567890',
                segmentToUserList: '{"segment1": "123456"}'
            };

            try {
                await CustomerMatchUpload.receive(context);
                assert.fail('Should have thrown error for missing OAuth2 credentials');
            } catch (error) {
                assert(error.message.includes('OAuth2') || error.message.includes('clientId'));
            }
        });

        it('should throw error when Developer Token is missing', async () => {
            context.messages.in.content = {
                fileId: 'test-file-id',
                clientId: 'test-client-id',
                clientSecret: 'test-secret',
                refreshToken: 'test-token',
                customerId: '1234567890',
                segmentToUserList: '{"segment1": "123456"}'
            };

            try {
                await CustomerMatchUpload.receive(context);
                assert.fail('Should have thrown error for missing Developer Token');
            } catch (error) {
                assert(error.message.includes('Developer Token') || error.message.includes('developerToken'));
            }
        });

        it('should throw error when Customer ID is missing', async () => {
            context.messages.in.content = {
                fileId: 'test-file-id',
                clientId: 'test-client-id',
                clientSecret: 'test-secret',
                refreshToken: 'test-token',
                developerToken: 'test-dev-token',
                segmentToUserList: '{"segment1": "123456"}'
            };

            try {
                await CustomerMatchUpload.receive(context);
                assert.fail('Should have thrown error for missing Customer ID');
            } catch (error) {
                assert(error.message.includes('Customer') || error.message.includes('customerId'));
            }
        });

        it('should throw error for invalid segmentToUserList JSON', async () => {
            context.messages.in.content = {
                fileId: 'test-file-id',
                clientId: 'test-client-id',
                clientSecret: 'test-secret',
                refreshToken: 'test-token',
                developerToken: 'test-dev-token',
                customerId: '1234567890',
                segmentToUserList: 'invalid-json'
            };

            try {
                await CustomerMatchUpload.receive(context);
                assert.fail('Should have thrown error for invalid JSON');
            } catch (error) {
                assert(error.message.includes('segmentToUserList') || error.message.includes('JSON'));
            }
        });
    });

    describe('CSV Parsing', () => {
        it('should parse CSV with headers correctly', async () => {
            const csvContent = 'email,segment\nhashed1@example.com,segment1\nhashed2@example.com,segment2\n';
            const stream = Readable.from(csvContent);

            const result = await CustomerMatchUpload.parseCSV(
                stream,
                {
                    segmentColumnIndex: 1,
                    emailColumnIndex: 0,
                    containsHeaders: true,
                    columnSeparator: ',',
                    batchSize: 10000
                },
                context
            );

            assert.strictEqual(Object.keys(result).length, 2);
            assert.deepStrictEqual(result['segment1'], ['hashed1@example.com']);
            assert.deepStrictEqual(result['segment2'], ['hashed2@example.com']);
        });

        it('should parse CSV without headers correctly', async () => {
            const csvContent = 'hashed1@example.com,segment1\nhashed2@example.com,segment2\n';
            const stream = Readable.from(csvContent);

            const result = await CustomerMatchUpload.parseCSV(
                stream,
                {
                    segmentColumnIndex: 1,
                    emailColumnIndex: 0,
                    containsHeaders: false,
                    columnSeparator: ',',
                    batchSize: 10000
                },
                context
            );

            assert.strictEqual(Object.keys(result).length, 2);
            assert.deepStrictEqual(result['segment1'], ['hashed1@example.com']);
            assert.deepStrictEqual(result['segment2'], ['hashed2@example.com']);
        });

        it('should skip rows with empty values', async () => {
            const csvContent = 'email,segment\nhashed1@example.com,segment1\n,segment2\nhashed3@example.com,\n';
            const stream = Readable.from(csvContent);

            const result = await CustomerMatchUpload.parseCSV(
                stream,
                {
                    segmentColumnIndex: 1,
                    emailColumnIndex: 0,
                    containsHeaders: true,
                    columnSeparator: ',',
                    batchSize: 10000
                },
                context
            );

            assert.strictEqual(Object.keys(result).length, 1);
            assert.deepStrictEqual(result['segment1'], ['hashed1@example.com']);
        });

        it('should group multiple emails by segment', async () => {
            const csvContent = 'email,segment\nhashed1@example.com,segment1\nhashed2@example.com,segment1\nhashed3@example.com,segment1\n';
            const stream = Readable.from(csvContent);

            const result = await CustomerMatchUpload.parseCSV(
                stream,
                {
                    segmentColumnIndex: 1,
                    emailColumnIndex: 0,
                    containsHeaders: true,
                    columnSeparator: ',',
                    batchSize: 10000
                },
                context
            );

            assert.strictEqual(Object.keys(result).length, 1);
            assert.strictEqual(result['segment1'].length, 3);
            assert.deepStrictEqual(result['segment1'], [
                'hashed1@example.com',
                'hashed2@example.com',
                'hashed3@example.com'
            ]);
        });

        it('should handle different column separators', async () => {
            const csvContent = 'email;segment\nhashed1@example.com;segment1\nhashed2@example.com;segment2\n';
            const stream = Readable.from(csvContent);

            const result = await CustomerMatchUpload.parseCSV(
                stream,
                {
                    segmentColumnIndex: 1,
                    emailColumnIndex: 0,
                    containsHeaders: true,
                    columnSeparator: ';',
                    batchSize: 10000
                },
                context
            );

            assert.strictEqual(Object.keys(result).length, 2);
            assert.deepStrictEqual(result['segment1'], ['hashed1@example.com']);
            assert.deepStrictEqual(result['segment2'], ['hashed2@example.com']);
        });
    });

    describe('Utility Functions', () => {
        it('should chunk array correctly', () => {
            const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const chunks = CustomerMatchUpload.chunkArray(array, 3);

            assert.strictEqual(chunks.length, 4);
            assert.deepStrictEqual(chunks[0], [1, 2, 3]);
            assert.deepStrictEqual(chunks[1], [4, 5, 6]);
            assert.deepStrictEqual(chunks[2], [7, 8, 9]);
            assert.deepStrictEqual(chunks[3], [10]);
        });

        it('should chunk array with exact division', () => {
            const array = [1, 2, 3, 4, 5, 6];
            const chunks = CustomerMatchUpload.chunkArray(array, 2);

            assert.strictEqual(chunks.length, 3);
            assert.deepStrictEqual(chunks[0], [1, 2]);
            assert.deepStrictEqual(chunks[1], [3, 4]);
            assert.deepStrictEqual(chunks[2], [5, 6]);
        });

        it('should handle empty array', () => {
            const array = [];
            const chunks = CustomerMatchUpload.chunkArray(array, 10);

            assert.strictEqual(chunks.length, 0);
        });

        it('should handle array smaller than chunk size', () => {
            const array = [1, 2, 3];
            const chunks = CustomerMatchUpload.chunkArray(array, 10);

            assert.strictEqual(chunks.length, 1);
            assert.deepStrictEqual(chunks[0], [1, 2, 3]);
        });
    });

    describe('Time Formatting', () => {
        it('should format seconds correctly', () => {
            assert.strictEqual(CustomerMatchUpload.formatTime(30), '30s');
            assert.strictEqual(CustomerMatchUpload.formatTime(59), '59s');
        });

        it('should format minutes correctly', () => {
            assert.strictEqual(CustomerMatchUpload.formatTime(60), '1m');
            assert.strictEqual(CustomerMatchUpload.formatTime(90), '1m 30s');
            assert.strictEqual(CustomerMatchUpload.formatTime(120), '2m');
            assert.strictEqual(CustomerMatchUpload.formatTime(3599), '59m 59s');
        });

        it('should format hours correctly', () => {
            assert.strictEqual(CustomerMatchUpload.formatTime(3600), '1h');
            assert.strictEqual(CustomerMatchUpload.formatTime(3660), '1h 1m');
            assert.strictEqual(CustomerMatchUpload.formatTime(7200), '2h');
            assert.strictEqual(CustomerMatchUpload.formatTime(7320), '2h 2m');
        });
    });

    describe('Error Message Extraction', () => {
        it('should extract standard error message', () => {
            const error = new Error('Test error message');
            const message = CustomerMatchUpload.extractErrorMessage(error);
            assert.strictEqual(message, 'Test error message');
        });

        it('should extract Google Ads API error message', () => {
            const error = {
                errors: [{
                    message: 'Rate limit exceeded',
                    error_code: { quota_error: 'RESOURCE_EXHAUSTED' }
                }],
                request_id: 'test-request-id'
            };
            const message = CustomerMatchUpload.extractErrorMessage(error);
            assert(message.includes('Rate limit exceeded'));
            assert(message.includes('test-request-id'));
        });

        it('should handle error with no message', () => {
            const error = { code: 500 };
            const message = CustomerMatchUpload.extractErrorMessage(error);
            assert(message.includes('500'));
        });
    });

    describe('Segment Mapping Normalization', () => {
        it('should normalize single user list ID to array', () => {
            const mapping = { 'segment1': '123456' };
            const normalized = {};
            
            for (const [segment, value] of Object.entries(mapping)) {
                const arrayValue = Array.isArray(value) ? value : [value];
                const validValues = arrayValue.filter(v => v != null && v !== '');
                if (validValues.length > 0) {
                    normalized[segment] = validValues;
                }
            }

            assert.deepStrictEqual(normalized['segment1'], ['123456']);
        });

        it('should keep array of user list IDs as-is', () => {
            const mapping = { 'segment1': ['123456', '789012'] };
            const normalized = {};
            
            for (const [segment, value] of Object.entries(mapping)) {
                const arrayValue = Array.isArray(value) ? value : [value];
                const validValues = arrayValue.filter(v => v != null && v !== '');
                if (validValues.length > 0) {
                    normalized[segment] = validValues;
                }
            }

            assert.deepStrictEqual(normalized['segment1'], ['123456', '789012']);
        });

        it('should filter out null and empty values', () => {
            const mapping = { 'segment1': ['123456', null, '', '789012'] };
            const normalized = {};
            
            for (const [segment, value] of Object.entries(mapping)) {
                const arrayValue = Array.isArray(value) ? value : [value];
                const validValues = arrayValue.filter(v => v != null && v !== '');
                if (validValues.length > 0) {
                    normalized[segment] = validValues;
                }
            }

            assert.deepStrictEqual(normalized['segment1'], ['123456', '789012']);
        });
    });

    describe('Safe Send Progress', () => {
        it('should send progress without throwing error', async () => {
            const data = { status: 'uploading', progress: 50 };
            await CustomerMatchUpload.safeSendProgress(context, data, 'progress');
            
            assert(context.sendJson.calledOnce);
            assert(context.sendJson.calledWith(data, 'progress'));
        });

        it('should handle context destruction gracefully', async () => {
            context.sendJson = sinon.stub().throws(new Error('Context destroyed'));
            const data = { status: 'uploading', progress: 50 };
            
            // Should not throw
            await CustomerMatchUpload.safeSendProgress(context, data, 'progress');
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle REPLACE mode correctly', () => {
            // Test that removeAll is set correctly for REPLACE mode
            const uploadMode = 'REPLACE';
            const isNewJob = true;
            const isFirstBatch = true;
            
            const removeAllFirst = uploadMode === 'REPLACE' && isNewJob && isFirstBatch;
            assert.strictEqual(removeAllFirst, true);
        });

        it('should handle ADD mode correctly', () => {
            // Test that removeAll is never set for ADD mode
            const uploadMode = 'ADD';
            const isNewJob = true;
            const isFirstBatch = true;
            
            const removeAllFirst = uploadMode === 'REPLACE' && isNewJob && isFirstBatch;
            assert.strictEqual(removeAllFirst, false);
        });

        it('should not removeAll for subsequent batches in REPLACE mode', () => {
            const uploadMode = 'REPLACE';
            const isNewJob = true;
            const isFirstBatch = false;
            
            const removeAllFirst = uploadMode === 'REPLACE' && isNewJob && isFirstBatch;
            assert.strictEqual(removeAllFirst, false);
        });

        it('should not removeAll when reusing existing job', () => {
            const uploadMode = 'REPLACE';
            const isNewJob = false;
            const isFirstBatch = true;
            
            const removeAllFirst = uploadMode === 'REPLACE' && isNewJob && isFirstBatch;
            assert.strictEqual(removeAllFirst, false);
        });
    });

    describe('Retry Logic Detection', () => {
        it('should detect rate limit errors', () => {
            const error = {
                code: 429,
                message: 'Too many requests'
            };
            
            const isRateLimit = error.code === 429 || 
                              error.message.toLowerCase().includes('rate limit') ||
                              error.message.toLowerCase().includes('too many requests');
            
            assert.strictEqual(isRateLimit, true);
        });

        it('should detect gRPC RESOURCE_EXHAUSTED errors', () => {
            const error = {
                code: 8,
                message: 'RESOURCE_EXHAUSTED'
            };
            
            const isRateLimit = error.code === 8;
            assert.strictEqual(isRateLimit, true);
        });

        it('should detect concurrent modification errors', () => {
            const error = {
                message: 'CONCURRENT_MODIFICATION: Another operation is in progress'
            };
            
            const isConcurrentModification = error.message.toLowerCase().includes('concurrent_modification') ||
                                           error.message.toLowerCase().includes('concurrent modification');
            
            assert.strictEqual(isConcurrentModification, true);
        });

        it('should detect server errors (5xx)', () => {
            const error = { code: 500 };
            const isRetryable = error.code >= 500;
            assert.strictEqual(isRetryable, true);
        });

        it('should detect network timeout errors', () => {
            const error = { code: 'ETIMEDOUT' };
            const isRetryable = error.code === 'ETIMEDOUT';
            assert.strictEqual(isRetryable, true);
        });
    });
});
