const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('AddSubscriberToSequence', () => {

    let AddSubscriberToSequence;
    let CreateSubscriber;
    let ListSequences;
    let context;
    let testSubscriberId;
    let testSequenceId;

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

        AddSubscriberToSequence = require('../../src/appmixer/kit/sequence/AddSubscriberToSequence/AddSubscriberToSequence');
        CreateSubscriber = require('../../src/appmixer/kit/subscriber/CreateSubscriber/CreateSubscriber');
        ListSequences = require('../../src/appmixer/kit/sequence/ListSequences/ListSequences');

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

        // Create a test subscriber first
        const testEmail = `test-addseq+${Date.now()}@example.com`;
        context.messages.in.content = {
            email: testEmail,
            firstName: 'AddSeq',
            state: 'active'
        };

        const createSubscriberResult = await CreateSubscriber.receive(context);
        testSubscriberId = createSubscriberResult.data.id;

        // Get available sequences
        context.messages.in.content = {};
        context.properties = { isSource: true };

        const listSequencesResult = await ListSequences.receive(context);
        if (listSequencesResult.data.result.length === 0) {
            console.log('No sequences available for testing AddSubscriberToSequence');
            this.skip();
        }

        testSequenceId = listSequencesResult.data.result[0].id;
        context.properties = {}; // Reset properties
    });

    it('should add subscriber to sequence successfully', async () => {
        context.messages.in.content = {
            sequenceId: testSequenceId.toString(),
            subscriberId: testSubscriberId.toString()
        };

        try {
            const result = await AddSubscriberToSequence.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.id && typeof result.data.id === 'number', 'Expected result.data.id to be a number');
            assert.strictEqual(result.data.id, testSubscriberId, `Expected subscriber ID to match. Got: ${result.data.id}, Expected: ${testSubscriberId}`);
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
            sequenceId: testSequenceId.toString()
        };

        try {
            await AddSubscriberToSequence.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Subscriber ID is required'), `Expected error message to contain "Subscriber ID is required", got: ${error.message}`);
        }
    });

    it('should throw error when sequence ID is missing', async () => {
        context.messages.in.content = {
            subscriberId: testSubscriberId.toString()
        };

        try {
            await AddSubscriberToSequence.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Sequence ID is required'), `Expected error message to contain "Sequence ID is required", got: ${error.message}`);
        }
    });
});
