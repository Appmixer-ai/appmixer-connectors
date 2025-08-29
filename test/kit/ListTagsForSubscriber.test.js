const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('ListTagsForSubscriber', () => {

    let ListTagsForSubscriber;
    let CreateSubscriber;
    let context;
    let testSubscriberId;

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

        ListTagsForSubscriber = require('../../src/appmixer/kit/subscriber/ListTagsForSubscriber/ListTagsForSubscriber');
        CreateSubscriber = require('../../src/appmixer/kit/subscriber/CreateSubscriber/CreateSubscriber');

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

        // Create a test subscriber first to use in tests
        const testEmail = `test-listtags+${Date.now()}@example.com`;
        context.messages.in.content = {
            email: testEmail,
            firstName: 'ListTags',
            state: 'active'
        };

        const createResult = await CreateSubscriber.receive(context);
        testSubscriberId = createResult.data.id;
    });

    it('should list tags for subscriber as array', async () => {
        context.messages.in.content = {
            subscriberId: testSubscriberId.toString(),
            outputType: 'array'
        };

        try {
            const result = await ListTagsForSubscriber.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(Array.isArray(result.data.result), 'Expected result.data.result to be an array');
            assert(typeof result.data.count === 'number', 'Expected result.data.count to be a number');
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

    it('should generate output port options', async () => {
        context.messages.in.content = {
            subscriberId: testSubscriberId.toString(),
            outputType: 'array'
        };
        context.properties = {
            generateOutputPortOptions: true
        };

        try {
            const result = await ListTagsForSubscriber.receive(context);

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

    it('should throw error when subscriber ID is missing', async () => {
        context.messages.in.content = {
            outputType: 'array'
        };
        context.properties = {};

        try {
            await ListTagsForSubscriber.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Subscriber ID is required'), `Expected error message to contain "Subscriber ID is required", got: ${error.message}`);
        }
    });
});
