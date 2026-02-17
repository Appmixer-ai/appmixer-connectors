'use strict';

const assert = require('assert');
const sinon = require('sinon');

describe('Google Ads CustomerMatchUpload - Unit Tests', function() {
    let lib;

    this.timeout(10000);

    before(function() {
        // Load the lib for utility function testing
        lib = require('../../lib');
    });

    afterEach(function() {
        sinon.restore();
    });

    describe('Lib Functions Availability', function() {
        it('should have all required utility functions', function() {
            const requiredFunctions = [
                'safeSendProgress',
                'extractErrorMessage', 
                'parseCSV',
                'createUserDataJob',
                'addOperations',
                'runJob',
                'chunkArray',
                'formatTime'
            ];

            requiredFunctions.forEach(funcName => {
                assert(typeof lib[funcName] === 'function', `lib should have ${funcName} function`);
            });
        });
    });

    describe('Utility Functions Logic', function() {
        it('should chunk array correctly', function() {
            const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const chunks = lib.chunkArray(array, 3);
            
            assert.strictEqual(chunks.length, 4, 'Should create 4 chunks');
            assert.deepStrictEqual(chunks[0], [1, 2, 3], 'First chunk should be correct');
            assert.deepStrictEqual(chunks[1], [4, 5, 6], 'Second chunk should be correct');
            assert.deepStrictEqual(chunks[2], [7, 8, 9], 'Third chunk should be correct');
            assert.deepStrictEqual(chunks[3], [10], 'Fourth chunk should be correct');
        });

        it('should handle empty arrays', function() {
            const chunks = lib.chunkArray([], 5);
            assert.strictEqual(chunks.length, 0, 'Should return empty array for empty input');
        });

        it('should format time correctly', function() {
            assert.strictEqual(lib.formatTime(30), '30s', 'Should format seconds');
            assert.strictEqual(lib.formatTime(90), '1m 30s', 'Should format minutes and seconds');
            assert.strictEqual(lib.formatTime(3600), '1h', 'Should format hours');
            assert.strictEqual(lib.formatTime(3690), '1h 1m', 'Should format hours and minutes');
            assert.strictEqual(lib.formatTime(0), '0s', 'Should handle zero seconds');
        });

        it('should extract error messages from various error types', function() {
            // Standard Error
            const simpleError = new Error('Simple error message');
            assert.strictEqual(lib.extractErrorMessage(simpleError), 'Simple error message');

            // Google Ads API error structure
            const googleAdsError = {
                errors: [
                    { message: 'Google Ads API error' }
                ]
            };
            assert.strictEqual(lib.extractErrorMessage(googleAdsError), 'Google Ads API error');

            // Null/undefined error
            assert.strictEqual(lib.extractErrorMessage(null), 'Unknown error occurred');
            assert.strictEqual(lib.extractErrorMessage(undefined), 'Unknown error occurred');

            // String error
            assert.strictEqual(lib.extractErrorMessage('String error'), 'String error');
        });

        it('should safely send progress without throwing', function() {
            const mockContext = {
                sendJson: sinon.stub().throws(new Error('Context destroyed'))
            };

            // Should not throw even when sendJson fails
            assert.doesNotThrow(() => {
                lib.safeSendProgress(mockContext, { message: 'test' });
            });

            // Verify sendJson was called
            assert(mockContext.sendJson.calledOnce, 'sendJson should have been called');
        });
    });
});
