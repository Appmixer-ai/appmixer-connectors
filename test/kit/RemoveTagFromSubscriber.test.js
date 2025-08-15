const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('RemoveTagFromSubscriber', () => {

    let RemoveTagFromSubscriber;
    let CreateSubscriber;
    let CreateTag;
    let AddTagToSubscriber;
    let context;
    let testSubscriberId;
    let testTagId;

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

        RemoveTagFromSubscriber = require('../../src/appmixer/kit/tag/RemoveTagFromSubscriber/RemoveTagFromSubscriber');
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
            }
        };

        // Create a test subscriber first
        const testEmail = `test-removetag+${Date.now()}@example.com`;
        context.messages.in.content = {
            email: testEmail,
            firstName: 'RemoveTag',
            state: 'active'
        };

        const createSubscriberResult = await CreateSubscriber.receive(context);
        testSubscriberId = createSubscriberResult.data.id;

        // Create a test tag
        const testTagName = `Test Tag RemoveTag ${Date.now()}`;
        context.messages.in.content = {
            name: testTagName
        };

        const createTagResult = await CreateTag.receive(context);
        testTagId = createTagResult.data.id;

        // Add tag to subscriber first so we can remove it
        context.messages.in.content = {
            tagId: testTagId.toString(),
            subscriberId: testSubscriberId.toString()
        };

        await AddTagToSubscriber.receive(context);
    });

    it('should remove tag from subscriber successfully', async () => {
        context.messages.in.content = {
            tagId: testTagId.toString(),
            subscriberId: testSubscriberId.toString()
        };

        try {
            const result = await RemoveTagFromSubscriber.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
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
            tagId: testTagId.toString()
        };

        try {
            await RemoveTagFromSubscriber.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Subscriber ID is required'), `Expected error message to contain "Subscriber ID is required", got: ${error.message}`);
        }
    });

    it('should throw error when tag ID is missing', async () => {
        context.messages.in.content = {
            subscriberId: testSubscriberId.toString()
        };

        try {
            await RemoveTagFromSubscriber.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Tag ID is required'), `Expected error message to contain "Tag ID is required", got: ${error.message}`);
        }
    });
});
