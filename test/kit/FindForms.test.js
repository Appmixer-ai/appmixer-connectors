const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('FindForms', () => {

    let FindForms;
    let context;

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

        FindForms = require('../../src/appmixer/kit/form/FindForms/FindForms');

        context = {
            auth: {
                apiKey: process.env.KIT_API_KEY
            },
            messages: {
                in: {
                    content: {}
                }
            },
            sendJson: function(data, port) {
                return { data, port };
            },
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            },
            properties: {}
        };
    });

    it('should find forms as array', async () => {
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            const result = await FindForms.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');

            if (result.port === 'notFound') {
                // No forms found, which is valid
                assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            } else {
                // Forms found
                assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
                assert(Array.isArray(result.data.result), 'Expected result.data.result to be an array');
                assert(typeof result.data.count === 'number', 'Expected result.data.count to be a number');
                assert.strictEqual(result.port, 'out', 'Expected port to be "out"');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - API key may be invalid');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: API key is invalid. Please check the KIT_API_KEY in .env file');
            }
            throw error;
        }
    });

    it('should generate output port options', async () => {
        context.messages.in.content = {
            outputType: 'array'
        };
        context.properties = {
            generateOutputPortOptions: true
        };

        try {
            const result = await FindForms.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(Array.isArray(result.data), 'Expected result.data to be an array');
            assert(result.data.length > 0, 'Expected result.data to have items');
            assert.strictEqual(result.port, 'out', 'Expected port to be "out"');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - API key may be invalid');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: API key is invalid. Please check the KIT_API_KEY in .env file');
            }
            throw error;
        }
    });

    it('should work as source component', async () => {
        context.messages.in.content = {};
        context.properties = {
            isSource: true
        };

        try {
            const result = await FindForms.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(Array.isArray(result.data.result), 'Expected result.data.result to be an array');
            assert.strictEqual(result.port, 'out', 'Expected port to be "out"');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - API key may be invalid');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: API key is invalid. Please check the KIT_API_KEY in .env file');
            }
            throw error;
        }
    });
});
