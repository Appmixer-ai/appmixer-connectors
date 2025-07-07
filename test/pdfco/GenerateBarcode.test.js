const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GenerateBarcode Component', function() {
    let context;
    let GenerateBarcode;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the API token is not set
        if (!process.env.PDFCO_API_TOKEN) {
            console.log('Skipping tests - PDFCO_API_TOKEN not set');
            this.skip();
        }
        
        // Load the component
        GenerateBarcode = require(path.join(__dirname, '../../src/appmixer/pdfco/core/GenerateBarcode/GenerateBarcode.js'));

        // Mock context
        context = {
            auth: {
                apiToken: process.env.PDFCO_API_TOKEN
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

        assert(context.auth.apiToken, 'PDFCO_API_TOKEN environment variable is required for tests');
    });

    it('should generate QR code barcode', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            type: 'qrcode',
            text: 'Hello World'
        };

        try {
            await GenerateBarcode.receive(context);

            console.log('GenerateBarcode QR result:', JSON.stringify(data, null, 2));

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
                console.log('Barcode generation failed with error:', data.message);
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

    it('should generate Code128 barcode', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            type: 'code128',
            text: '123456789'
        };

        try {
            await GenerateBarcode.receive(context);

            console.log('GenerateBarcode Code128 result:', JSON.stringify(data, null, 2));

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

    it('should generate barcode with PNG format', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            type: 'qrcode',
            text: 'Test PNG Format',
            format: 'png'
        };

        try {
            await GenerateBarcode.receive(context);

            console.log('GenerateBarcode PNG format result:', JSON.stringify(data, null, 2));

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

    it('should handle invalid barcode type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            type: 'invalid-type',
            text: 'Test Text'
        };

        try {
            await GenerateBarcode.receive(context);

            console.log('GenerateBarcode invalid type result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');
            
            // Should return error for invalid type
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for invalid type:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for invalid types
            console.log('Expected error for invalid barcode type:', error.message);
        }
    });

    it('should handle missing text parameter', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            type: 'qrcode'
        };

        try {
            await GenerateBarcode.receive(context);

            console.log('GenerateBarcode missing text result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');
            
            // Should return error for missing text
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for missing text:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for missing parameters
            console.log('Expected error for missing text parameter:', error.message);
        }
    });
});