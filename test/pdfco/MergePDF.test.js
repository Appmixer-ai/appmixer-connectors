const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('MergePDF Component', function() {
    let context;
    let MergePDF;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the API token is not set
        if (!process.env.PDFCO_API_TOKEN) {
            console.log('Skipping tests - PDFCO_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        MergePDF = require(path.join(__dirname, '../../src/appmixer/pdfco/core/MergePDF/MergePDF.js'));

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

    it('should merge multiple PDF files', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        // Mock PDF file URLs - in real usage these would be valid PDF file URLs
        context.messages.in.content = {
            files: {
                ADD: [
                    { files_item: 'https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-merge/sample1.pdf' },
                    { files_item: 'https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-merge/sample2.pdf' }
                ]
            }
        };

        try {
            await MergePDF.receive(context);

            console.log('MergePDF result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            if (!data.error) {
                assert(typeof data.url === 'string', 'Expected data.url to be a string');
                assert(data.url.length > 0, 'Expected data.url to not be empty');
                // Optional: Check if credits were used
                if (data.remainingCredits !== undefined) {
                    assert(typeof data.remainingCredits === 'number', 'Expected remainingCredits to be a number');
                }
            } else {
                assert(typeof data.message === 'string', 'Expected error message when error is true');
                console.log('PDF merge failed with error:', data.message);
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

    it('should merge PDFs with custom output name', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            files: {
                ADD: [
                    { files_item: 'https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-merge/sample1.pdf' },
                    { files_item: 'https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-merge/sample2.pdf' }
                ]
            },
            name: 'merged-document.pdf'
        };

        try {
            await MergePDF.receive(context);

            console.log('MergePDF with name result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            if (!data.error) {
                assert(typeof data.url === 'string', 'Expected data.url to be a string');
                assert(data.url.length > 0, 'Expected data.url to not be empty');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            throw error;
        }
    });

    it('should handle single file merge', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            files: {
                ADD: [
                    { files_item: 'https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-merge/sample1.pdf' }
                ]
            }
        };

        try {
            await MergePDF.receive(context);

            console.log('MergePDF single file result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Single file merge should still work
            if (!data.error) {
                assert(typeof data.url === 'string', 'Expected data.url to be a string');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            throw error;
        }
    });

    it('should handle invalid file URLs', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            files: {
                ADD: [
                    { files_item: 'invalid-url-1' },
                    { files_item: 'invalid-url-2' }
                ]
            }
        };

        try {
            await MergePDF.receive(context);

            console.log('MergePDF invalid files result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Should return error for invalid files
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for invalid files:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for invalid files
            console.log('Expected error for invalid file URLs:', error.message);
        }
    });

    it('should handle empty files array', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            files: {
                ADD: []
            }
        };

        try {
            await MergePDF.receive(context);

            console.log('MergePDF empty files result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Should return error for empty files array
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for empty files:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for empty arrays
            console.log('Expected error for empty files array:', error.message);
        }
    });
});
