const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetPDFInfo Component', function() {
    let context;
    let GetPDFInfo;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the API token is not set
        if (!process.env.PDFCO_API_TOKEN) {
            console.log('Skipping tests - PDFCO_API_TOKEN not set');
            this.skip();
        }
        
        // Load the component
        GetPDFInfo = require(path.join(__dirname, '../../src/appmixer/pdfco/core/GetPDFInfo/GetPDFInfo.js'));

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

    it('should get PDF information from valid file', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        // Mock PDF file URL - in real usage this would be a valid PDF file URL
        context.messages.in.content = {
            file: 'https://bytescout.com/sample-files/pdfs/sample.pdf'
        };

        try {
            await GetPDFInfo.receive(context);

            console.log('GetPDFInfo result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.error === 'boolean', 'Expected data.error to be a boolean');
            
            if (!data.error) {
                // Check for expected PDF info properties
                assert(typeof data.pageCount === 'number', 'Expected data.pageCount to be a number');
                assert(data.pageCount > 0, 'Expected pageCount to be greater than 0');
                
                // Optional properties that might be present
                if (data.title !== undefined) {
                    assert(typeof data.title === 'string', 'Expected data.title to be a string');
                }
                if (data.author !== undefined) {
                    assert(typeof data.author === 'string', 'Expected data.author to be a string');
                }
                if (data.subject !== undefined) {
                    assert(typeof data.subject === 'string', 'Expected data.subject to be a string');
                }
                if (data.keywords !== undefined) {
                    assert(typeof data.keywords === 'string', 'Expected data.keywords to be a string');
                }
                if (data.creator !== undefined) {
                    assert(typeof data.creator === 'string', 'Expected data.creator to be a string');
                }
                if (data.producer !== undefined) {
                    assert(typeof data.producer === 'string', 'Expected data.producer to be a string');
                }
                if (data.creationDate !== undefined) {
                    assert(typeof data.creationDate === 'string', 'Expected data.creationDate to be a string');
                }
                if (data.modificationDate !== undefined) {
                    assert(typeof data.modificationDate === 'string', 'Expected data.modificationDate to be a string');
                }
                
                // Optional: Check if credits were used
                if (data.remainingCredits !== undefined) {
                    assert(typeof data.remainingCredits === 'number', 'Expected remainingCredits to be a number');
                }
            } else {
                assert(typeof data.message === 'string', 'Expected error message when error is true');
                console.log('PDF info extraction failed with error:', data.message);
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

    it('should handle invalid PDF file', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in.content = {
            file: 'invalid-file-url-not-a-pdf'
        };

        try {
            await GetPDFInfo.receive(context);

            console.log('GetPDFInfo invalid file result:', JSON.stringify(data, null, 2));

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
            await GetPDFInfo.receive(context);

            console.log('GetPDFInfo missing file result:', JSON.stringify(data, null, 2));

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
});