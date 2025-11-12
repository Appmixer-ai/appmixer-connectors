const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('ListAssistants Component', function() {
    let context;
    let ListAssistants;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the API key is not set
        if (!process.env.VAPI_API_KEY) {
            console.log('Skipping tests - VAPI_API_KEY not set');
            this.skip();
        }

        // Load the component
        ListAssistants = require(path.join(__dirname, '../../src/appmixer/vapi/core/ListAssistants/ListAssistants.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.VAPI_API_KEY
            },
            messages: {
                in: {}
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

        assert(context.auth.apiKey, 'VAPI_API_KEY environment variable is required for tests');
    });

    it('should list assistants successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                outputType: 'array'
            }
        };

        await ListAssistants.receive(context);

        console.log('ListAssistants output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.result !== undefined, 'Expected result array to be returned');
        assert(Array.isArray(data.result), 'Expected result to be an array');
    });

    it('should generate output port options', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.properties = {
            generateOutputPortOptions: true
        };

        context.messages.in = {
            content: {
                outputType: 'object'
            }
        };

        await ListAssistants.receive(context);

        assert(data, 'Expected output port options to be returned');
        assert(Array.isArray(data), 'Expected options to be an array');
    });
});
