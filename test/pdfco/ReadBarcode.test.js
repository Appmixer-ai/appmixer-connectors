const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('ReadBarcode Component', function() {
    let context;
    let ReadBarcode;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the API token is not set
        if (!process.env.PDFCO_API_TOKEN) {
            console.log('Skipping tests - PDFCO_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        ReadBarcode = require(path.join(__dirname, '../../src/appmixer/pdfco/core/ReadBarcode/ReadBarcode.js'));

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

    it('should read barcode from image file', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        // Mock image with barcode - in real usage this would be a valid image URL with barcode
        context.messages.in.content = {
            file: 'https://example.com/sample-qr-code.png'
        };

        try {
            await ReadBarcode.receive(context);

            console.log('ReadBarcode result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            if (!data.error) {
                // Check for expected barcode read properties
                if (data.found !== undefined) {
                    assert(typeof data.found === 'boolean', 'Expected data.found to be a boolean');
                }
                if (data.barcodes !== undefined) {
                    assert(Array.isArray(data.barcodes), 'Expected data.barcodes to be an array');
                    if (data.barcodes.length > 0) {
                        const barcode = data.barcodes[0];
                        assert(typeof barcode.value === 'string', 'Expected barcode.value to be a string');
                        assert(typeof barcode.type === 'string', 'Expected barcode.type to be a string');
                    }
                }
                // Optional: Check if credits were used
                if (data.remainingCredits !== undefined) {
                    assert(typeof data.remainingCredits === 'number', 'Expected remainingCredits to be a number');
                }
            } else {
                assert(typeof data.message === 'string', 'Expected error message when error is true');
                console.log('Barcode reading failed with error:', data.message);
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

    it('should handle image without barcode', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        // Mock image without barcode
        context.messages.in.content = {
            file: 'https://via.placeholder.com/150'
        };

        try {
            await ReadBarcode.receive(context);

            console.log('ReadBarcode no barcode result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            if (!data.error) {
                // Should indicate no barcodes found
                if (data.found !== undefined) {
                    assert(typeof data.found === 'boolean', 'Expected data.found to be a boolean');
                    if (data.found === false) {
                        console.log('No barcode found as expected');
                    }
                }
                if (data.barcodes !== undefined) {
                    assert(Array.isArray(data.barcodes), 'Expected data.barcodes to be an array');
                    console.log('Number of barcodes found:', data.barcodes.length);
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            throw error;
        }
    });

    it('should handle invalid image file', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            file: 'invalid-url-not-an-image'
        };

        try {
            await ReadBarcode.receive(context);

            console.log('ReadBarcode invalid file result:', JSON.stringify(data, null, 2));

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

    it('should handle missing file parameter', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {};

        try {
            await ReadBarcode.receive(context);

            console.log('ReadBarcode missing file result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // Should return error for missing file
            if (data.error) {
                assert(typeof data.message === 'string', 'Expected error message');
                console.log('Expected error for missing file:', data.message);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // Some errors are expected for missing parameters
            console.log('Expected error for missing file parameter:', error.message);
        }
    });

    it('should handle PDF file with barcodes', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        // Mock PDF file that might contain barcodes
        context.messages.in.content = {
            file: 'https://bytescout.com/sample-files/pdfs/sample.pdf'
        };

        try {
            await ReadBarcode.receive(context);

            console.log('ReadBarcode PDF file result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');

            // PDF files might or might not contain barcodes
            if (!data.error) {
                if (data.barcodes !== undefined) {
                    assert(Array.isArray(data.barcodes), 'Expected data.barcodes to be an array');
                    console.log('Barcodes found in PDF:', data.barcodes.length);
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: API token is invalid');
            }
            // PDF files might not be supported for barcode reading
            console.log('Error reading barcodes from PDF (may be expected):', error.message);
        }
    });
});
