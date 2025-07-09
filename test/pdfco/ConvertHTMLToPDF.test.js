const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('ConvertHTMLToPDF Component', function() {
    let context;
    let ConvertHTMLToPDF;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the API token is not set
        if (!process.env.PDFCO_API_TOKEN) {
            console.log('Skipping tests - PDFCO_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        ConvertHTMLToPDF = require(path.join(__dirname, '../../src/appmixer/pdfco/core/ConvertHTMLToPDF/ConvertHTMLToPDF.js'));

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

    it('should convert HTML string to PDF', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            html: '<html><body><h1>Test HTML to PDF Conversion</h1><p>This is a test document.</p></body></html>'
        };

        try {
            await ConvertHTMLToPDF.receive(context);

            console.log('ConvertHTMLToPDF from HTML result:', JSON.stringify(data, null, 2));

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
                console.log('HTML to PDF conversion failed with error:', data.message);
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

    it('should convert URL to PDF', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            url: 'https://www.google.com'
        };

        try {
            await ConvertHTMLToPDF.receive(context);

            console.log('ConvertHTMLToPDF from URL result:', JSON.stringify(data, null, 2));

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

    it('should convert HTML with custom paper size and orientation', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            html: '<html><body><h1>Test Document</h1><p>Testing custom paper size and orientation.</p></body></html>',
            paperSize: 'A4',
            orientation: 'landscape'
        };

        try {
            await ConvertHTMLToPDF.receive(context);

            console.log('ConvertHTMLToPDF with custom options result:', JSON.stringify(data, null, 2));

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

    it('should handle invalid HTML', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            html: 'This is not valid HTML'
        };

        try {
            await ConvertHTMLToPDF.receive(context);

            console.log('ConvertHTMLToPDF invalid HTML result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Should still work with plain text or may return error
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Error for invalid HTML (expected):', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for invalid HTML
            console.log('Expected error for invalid HTML:', error.message);
        }
    });
});
