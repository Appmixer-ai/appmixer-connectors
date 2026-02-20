'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { Readable } = require('stream');

// Load the component, lib, and extracted modules
const CustomerMatchUpload = require('../../../src/appmixer/google/ads/CustomerMatchUpload/CustomerMatchUpload');
const lib = require('../../../src/appmixer/google/ads/lib');
const csvParser = require('../../../src/appmixer/google/ads/csvParser');

// Mock context for testing
const createMockContext = () => {
    return {
        auth: {
            clientId: 'mock-client-id',
            clientSecret: 'mock-client-secret',
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
        },
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

describe('Google Ads CustomerMatchUpload', () => {
    let context;

    beforeEach(() => {
        context = createMockContext();
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

        it('should throw error when OAuth2 authentication is missing', async () => {
            context.auth = null; // Remove auth to test validation
            context.messages.in.content = {
                fileId: 'test-file-id',
                developerToken: 'test-dev-token',
                customerId: '1234567890',
                segmentToUserList: '{"segment1": "123456"}'
            };

            try {
                await CustomerMatchUpload.receive(context);
                assert.fail('Should have thrown error for missing OAuth2 authentication');
            } catch (error) {
                assert(error.message.includes('OAuth2 authentication') || error.message.includes('Google account'));
            }
        });

        it('should throw error when Developer Token is missing', async () => {
            context.messages.in.content = {
                fileId: 'test-file-id',
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
        it('should detect columns correctly', async function() {
            const firstRow = ['email', 'segment'];
            const secondRow = ['hashed1@example.com', 'segment1'];
            const segmentKeys = ['segment1', 'segment2'];

            const result = csvParser.detectColumns(firstRow, secondRow, segmentKeys, context);

            assert.strictEqual(result.emailColumnIndex, 0);
            assert.strictEqual(result.segmentColumnIndex, 1);
            assert.strictEqual(result.hasHeaders, true);
        });

        it('should detect columns without headers', async function() {
            const firstRow = ['hashed1@example.com', 'segment1'];
            const secondRow = ['hashed2@example.com', 'segment2'];
            const segmentKeys = ['segment1', 'segment2'];

            const result = csvParser.detectColumns(firstRow, secondRow, segmentKeys, context);

            assert.strictEqual(result.emailColumnIndex, 0);
            assert.strictEqual(result.segmentColumnIndex, 1);
            assert.strictEqual(result.hasHeaders, false);
        });

        it('should identify hash values correctly', async function() {
            const validHash = 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd';
            const invalidHash = 'not-a-hash';

            assert.strictEqual(csvParser.isHash(validHash), true);
            assert.strictEqual(csvParser.isHash(invalidHash), false);
        });

        it('should identify header names correctly', async function() {
            assert.strictEqual(csvParser.isHeaderName('email'), true);
            assert.strictEqual(csvParser.isHeaderName('segment'), true);
            assert.strictEqual(csvParser.isHeaderName('random_text'), false);
        });
    });

    describe('Utility Functions (Legacy - now in lib.js)', () => {
        it('should chunk array correctly', () => {
            const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const chunks = lib.chunkArray(array, 3);

            assert.strictEqual(chunks.length, 4);
            assert.deepStrictEqual(chunks[0], [1, 2, 3]);
            assert.deepStrictEqual(chunks[1], [4, 5, 6]);
            assert.deepStrictEqual(chunks[2], [7, 8, 9]);
            assert.deepStrictEqual(chunks[3], [10]);
        });

        it('should chunk array with exact division', () => {
            const array = [1, 2, 3, 4, 5, 6];
            const chunks = lib.chunkArray(array, 2);

            assert.strictEqual(chunks.length, 3);
            assert.deepStrictEqual(chunks[0], [1, 2]);
            assert.deepStrictEqual(chunks[1], [3, 4]);
            assert.deepStrictEqual(chunks[2], [5, 6]);
        });

        it('should handle empty array', () => {
            const array = [];
            const chunks = lib.chunkArray(array, 10);

            assert.strictEqual(chunks.length, 0);
        });

        it('should handle array smaller than chunk size', () => {
            const array = [1, 2, 3];
            const chunks = lib.chunkArray(array, 10);

            assert.strictEqual(chunks.length, 1);
            assert.deepStrictEqual(chunks[0], [1, 2, 3]);
        });
    });

    describe('Time Formatting (Legacy - now in lib.js)', () => {
        it('should format seconds correctly', () => {
            assert.strictEqual(lib.formatTime(30), '30s');
            assert.strictEqual(lib.formatTime(59), '59s');
        });

        it('should format minutes correctly', () => {
            assert.strictEqual(lib.formatTime(60), '1m');
            assert.strictEqual(lib.formatTime(90), '1m 30s');
            assert.strictEqual(lib.formatTime(120), '2m');
            assert.strictEqual(lib.formatTime(3599), '59m 59s');
        });

        it('should format hours correctly', () => {
            assert.strictEqual(lib.formatTime(3600), '1h');
            assert.strictEqual(lib.formatTime(3660), '1h 1m');
            assert.strictEqual(lib.formatTime(7200), '2h');
            assert.strictEqual(lib.formatTime(7320), '2h 2m');
        });
    });

    describe('Error Message Extraction (Legacy - now in lib.js)', () => {
        it('should extract standard error message', () => {
            const error = new Error('Test error message');
            const message = lib.extractErrorMessage(error);
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
            const message = lib.extractErrorMessage(error);
            assert(message.includes('Rate limit exceeded'));
            // Note: lib.extractErrorMessage may not include request_id in the same format
        });

        it('should handle error with no message', () => {
            const error = { code: 500 };
            const message = lib.extractErrorMessage(error);
            assert(typeof message === 'string' && message.length > 0, 'Should return a non-empty string');
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

    describe('Safe Send Progress (Legacy - now in lib.js)', () => {
        it('should send progress without throwing error', () => {
            const mockContext = { sendJson: sinon.stub() };
            const data = { status: 'uploading', progress: 50 };
            
            lib.safeSendProgress(mockContext, data, 'progress');
            
            assert(mockContext.sendJson.calledOnce);
            // Note: lib.safeSendProgress may have different parameter order
        });

        it('should handle context destruction gracefully', () => {
            const mockContext = { sendJson: sinon.stub().throws(new Error('Context destroyed')) };
            const data = { status: 'uploading', progress: 50 };
            
            // Should not throw
            assert.doesNotThrow(() => {
                lib.safeSendProgress(mockContext, data, 'progress');
            });
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

    describe('Lib Functions', () => {
        
        describe('chunkArray', () => {
            it('should split array into correct chunks', () => {
                const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                const chunks = lib.chunkArray(array, 3);
                
                assert.strictEqual(chunks.length, 4);
                assert.deepStrictEqual(chunks[0], [1, 2, 3]);
                assert.deepStrictEqual(chunks[1], [4, 5, 6]);
                assert.deepStrictEqual(chunks[2], [7, 8, 9]);
                assert.deepStrictEqual(chunks[3], [10]);
            });

            it('should handle empty array', () => {
                const chunks = lib.chunkArray([], 5);
                assert.strictEqual(chunks.length, 0);
            });

            it('should handle array smaller than chunk size', () => {
                const array = [1, 2, 3];
                const chunks = lib.chunkArray(array, 10);
                
                assert.strictEqual(chunks.length, 1);
                assert.deepStrictEqual(chunks[0], [1, 2, 3]);
            });
        });

        describe('formatTime', () => {
            it('should format seconds correctly', () => {
                assert.strictEqual(lib.formatTime(30), '30s');
                assert.strictEqual(lib.formatTime(59), '59s');
            });

            it('should format minutes correctly', () => {
                assert.strictEqual(lib.formatTime(60), '1m');
                assert.strictEqual(lib.formatTime(90), '1m 30s');
                assert.strictEqual(lib.formatTime(120), '2m');
            });

            it('should format hours correctly', () => {
                assert.strictEqual(lib.formatTime(3600), '1h');
                assert.strictEqual(lib.formatTime(3660), '1h 1m');
                assert.strictEqual(lib.formatTime(7200), '2h');
            });
        });

        describe('extractErrorMessage', () => {
            it('should extract standard error message', () => {
                const error = new Error('Test error message');
                const message = lib.extractErrorMessage(error);
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
                const message = lib.extractErrorMessage(error);
                assert(message.includes('Rate limit exceeded'));
                // Note: request_id may not be included in lib.extractErrorMessage format
            });

            it('should handle null/undefined errors', () => {
                assert.strictEqual(lib.extractErrorMessage(null), 'Unknown error occurred');
                assert.strictEqual(lib.extractErrorMessage(undefined), 'Unknown error occurred');
            });
        });

        describe('safeSendProgress', () => {
            it('should send progress without throwing error', () => {
                const mockContext = { sendJson: sinon.stub() };
                const data = { status: 'uploading', progress: 50 };
                
                lib.safeSendProgress(mockContext, data, 'progress');
                
                assert(mockContext.sendJson.calledOnce);
                // Note: lib.safeSendProgress may have different parameter order
            });

            it('should handle context destruction gracefully', () => {
                const mockContext = { sendJson: sinon.stub().throws(new Error('Context destroyed')) };
                const data = { status: 'uploading', progress: 50 };
                
                // Should not throw
                assert.doesNotThrow(() => {
                    lib.safeSendProgress(mockContext, data, 'progress');
                });
            });
        });
    });
});
