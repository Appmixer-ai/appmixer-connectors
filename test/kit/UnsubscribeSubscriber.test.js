const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('UnsubscribeSubscriber', () => {

    let UnsubscribeSubscriber;
    let CreateSubscriber;
    let context;
    let testSubscriberId;

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

        UnsubscribeSubscriber = require('../../src/appmixer/kit/subscriber/UnsubscribeSubscriber/UnsubscribeSubscriber');
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
            }
        };

        // Create a test subscriber first to use in tests
        const testEmail = `test-unsubscribe+${Date.now()}@example.com`;
        context.messages.in.content = {
            email: testEmail,
            firstName: 'Unsub',
            lastName: 'Test'
        };

        const createResult = await CreateSubscriber.receive(context);
        testSubscriberId = createResult.data.id;
    });

    it('should unsubscribe subscriber successfully', async () => {
        context.messages.in.content = {
            subscriberId: testSubscriberId.toString()
        };

        try {
            const result = await UnsubscribeSubscriber.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            // Unsubscribe API returns empty response, so we just check that it succeeded
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

    it('should throw error when id is missing', async () => {
        context.messages.in.content = {};

        try {
            await UnsubscribeSubscriber.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Subscriber ID is required'), `Expected error message to contain "Subscriber ID is required", got: ${error.message}`);
        }
    });
});
