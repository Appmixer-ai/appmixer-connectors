const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('FindSubscribersForTag', () => {

    let FindSubscribersForTag;
    let CreateSubscriber;
    let CreateTag;
    let AddTagToSubscriber;
    let context;
    let testTagId;

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

        FindSubscribersForTag = require('../../src/appmixer/kit/tag/FindSubscribersForTag/FindSubscribersForTag');
        CreateSubscriber = require('../../src/appmixer/kit/subscriber/CreateSubscriber/CreateSubscriber');
        CreateTag = require('../../src/appmixer/kit/tag/CreateTag/CreateTag');
        AddTagToSubscriber = require('../../src/appmixer/kit/tag/AddTagToSubscriber/AddTagToSubscriber');

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

        // Create a test tag
        const testTagName = `Test Tag FindSubs ${Date.now()}`;
        context.messages.in.content = {
            name: testTagName
        };

        const createTagResult = await CreateTag.receive(context);
        testTagId = createTagResult.data.id;

        // Create a test subscriber and add the tag
        const testEmail = `test-findsubs+${Date.now()}@example.com`;
        context.messages.in.content = {
            email: testEmail,
            firstName: 'FindSubs',
            state: 'active'
        };

        const createSubscriberResult = await CreateSubscriber.receive(context);
        const testSubscriberId = createSubscriberResult.data.id;

        // Add tag to subscriber
        context.messages.in.content = {
            tagId: testTagId.toString(),
            subscriberId: testSubscriberId.toString()
        };

        await AddTagToSubscriber.receive(context);
    });

    it('should find subscribers for tag as array', async () => {
        context.messages.in.content = {
            tagId: testTagId.toString(),
            outputType: 'array'
        };

        try {
            const result = await FindSubscribersForTag.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(Array.isArray(result.data.result), 'Expected result.data.result to be an array');
            assert(typeof result.data.count === 'number', 'Expected result.data.count to be a number');
            assert(result.data.result.length > 0, 'Expected to find at least one subscriber');
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
            tagId: testTagId.toString(),
            outputType: 'array'
        };
        context.properties = {
            generateOutputPortOptions: true
        };

        try {
            const result = await FindSubscribersForTag.receive(context);

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

    it('should throw error when tag ID is missing', async () => {
        context.messages.in.content = {
            outputType: 'array'
        };
        context.properties = {};

        try {
            await FindSubscribersForTag.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Tag ID is required'), `Expected error message to contain "Tag ID is required", got: ${error.message}`);
        }
    });
});
