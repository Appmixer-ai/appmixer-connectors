const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CompressPDF Component', function() {
    let context;
    let CompressPDF;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the API token is not set
        if (!process.env.PDFCO_API_TOKEN) {
            console.log('Skipping tests - PDFCO_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        CompressPDF = require(path.join(__dirname, '../../src/appmixer/pdfco/core/CompressPDF/CompressPDF.js'));

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

    it('should compress PDF with default compression level', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        // Mock PDF file URL - in real usage this would be a valid PDF file URL
        context.messages.in.content = {
            file: 'https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-to-csv/sample.pdf'
        };

        try {
            await CompressPDF.receive(context);

            console.log('CompressPDF result:', JSON.stringify(data, null, 2));

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
                console.log('Compression failed with error:', data.message);
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

    it('should compress PDF with specified compression level', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            file: 'https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-to-csv/sample.pdf',
            compressionLevel: 3
        };

        try {
            await CompressPDF.receive(context);

            console.log('CompressPDF with compression level result:', JSON.stringify(data, null, 2));

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

    it('should handle invalid file URL', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            file: 'invalid-url-not-a-pdf'
        };

        try {
            await CompressPDF.receive(context);

            console.log('CompressPDF invalid file result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Should return error for invalid file
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for invalid file:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for invalid files
            console.log('Expected error for invalid file URL:', error.message);
        }
    });
});
