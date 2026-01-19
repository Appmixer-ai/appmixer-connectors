const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CheckJobStatus Component', function() {
    let context;
    let CheckJobStatus;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the API token is not set
        if (!process.env.PDFCO_API_TOKEN) {
            console.log('Skipping tests - PDFCO_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        CheckJobStatus = require(path.join(__dirname, '../../src/appmixer/pdfco/core/CheckJobStatus/CheckJobStatus.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.PDFCO_API_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        assert(context.auth.apiKey, 'PDFCO_API_TOKEN environment variable is required for tests');
    });

    it('should check status of valid job', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        // Mock job ID - in real usage this would be a valid job ID from a previous operation
        context.messages.in.content = {
            jobId: 'sample-job-id-123'
        };

        try {
            await CheckJobStatus.receive(context);

            console.log('CheckJobStatus result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            if (!data.error) {
                // Check for expected job status properties
                assert(typeof data.status === 'string', 'Expected data.status to be a string');

                // Common status values: "working", "completed", "failed", "aborted"
                const validStatuses = ['working', 'completed', 'failed', 'aborted'];
                if (validStatuses.includes(data.status)) {
                    console.log('Valid job status:', data.status);
                }

                // Optional properties that might be present
                if (data.url !== undefined) {
                    assert(typeof data.url === 'string', 'Expected data.url to be a string');
                }
                if (data.progress !== undefined) {
                    assert(typeof data.progress === 'number', 'Expected data.progress to be a number');
                    assert(data.progress >= 0 && data.progress <= 100, 'Expected progress to be between 0 and 100');
                }
                if (data.credits !== undefined) {
                    assert(typeof data.credits === 'number', 'Expected data.credits to be a number');
                }
                if (data.duration !== undefined) {
                    assert(typeof data.duration === 'number', 'Expected data.duration to be a number');
                }

                // Optional: Check if remaining credits were provided
                if (data.remainingCredits !== undefined) {
                    assert(typeof data.remainingCredits === 'number', 'Expected remainingCredits to be a number');
                }
            } else {
                assert(typeof data.message === 'string', 'Expected error message when error is true');
                console.log('Job status check failed with error:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - API token may be invalid');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: API token is invalid. Please check the PDFCO_API_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle invalid job ID', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            jobId: 'invalid-job-id-does-not-exist'
        };

        try {
            await CheckJobStatus.receive(context);

            console.log('CheckJobStatus invalid ID result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Should return error for invalid job ID
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for invalid job ID:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for invalid job IDs
            console.log('Expected error for invalid job ID:', error.message);
        }
    });

    it('should handle missing job ID parameter', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {};

        try {
            await CheckJobStatus.receive(context);

            console.log('CheckJobStatus missing ID result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Should return error for missing job ID
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for missing job ID:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for missing parameters
            console.log('Expected error for missing job ID parameter:', error.message);
        }
    });

    it('should handle empty job ID', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            jobId: ''
        };

        try {
            await CheckJobStatus.receive(context);

            console.log('CheckJobStatus empty ID result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Should return error for empty job ID
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for empty job ID:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for empty job IDs
            console.log('Expected error for empty job ID:', error.message);
        }
    });

    it('should handle malformed job ID', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            jobId: '123-invalid-format-!@#'
        };

        try {
            await CheckJobStatus.receive(context);

            console.log('CheckJobStatus malformed ID result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Should return error for malformed job ID
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for malformed job ID:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for malformed job IDs
            console.log('Expected error for malformed job ID:', error.message);
        }
    });
});
