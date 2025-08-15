const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('FindSubscribersForSequence', () => {

    let FindSubscribersForSequence;
    let CreateSubscriber;
    let ListSequences;
    let AddSubscriberToSequence;
    let context;
    let testSequenceId;

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

        FindSubscribersForSequence = require('../../src/appmixer/kit/sequence/FindSubscribersForSequence/FindSubscribersForSequence');
        CreateSubscriber = require('../../src/appmixer/kit/subscriber/CreateSubscriber/CreateSubscriber');
        ListSequences = require('../../src/appmixer/kit/sequence/ListSequences/ListSequences');
        AddSubscriberToSequence = require('../../src/appmixer/kit/sequence/AddSubscriberToSequence/AddSubscriberToSequence');

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

        // Get available sequences
        context.messages.in.content = {};
        context.properties = { isSource: true };

        const listSequencesResult = await ListSequences.receive(context);
        if (listSequencesResult.data.result.length === 0) {
            console.log('No sequences available for testing FindSubscribersForSequence');
            this.skip();
        }

        testSequenceId = listSequencesResult.data.result[0].id;
        context.properties = {}; // Reset properties

        // Create a test subscriber and add to sequence
        const testEmail = `test-findseqsubs+${Date.now()}@example.com`;
        context.messages.in.content = {
            email: testEmail,
            firstName: 'FindSeqSubs',
            state: 'active'
        };

        const createSubscriberResult = await CreateSubscriber.receive(context);
        const testSubscriberId = createSubscriberResult.data.id;

        // Add subscriber to sequence
        context.messages.in.content = {
            sequenceId: testSequenceId.toString(),
            subscriberId: testSubscriberId.toString()
        };

        await AddSubscriberToSequence.receive(context);
    });

    it('should find subscribers for sequence as array', async () => {
        context.messages.in.content = {
            sequenceId: testSequenceId.toString(),
            outputType: 'array'
        };

        try {
            const result = await FindSubscribersForSequence.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');

            if (result.port === 'notFound') {
                // No subscribers found, which is valid for some sequences
                assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            } else {
                // Subscribers found
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
            sequenceId: testSequenceId.toString(),
            outputType: 'array'
        };
        context.properties = {
            generateOutputPortOptions: true
        };

        try {
            const result = await FindSubscribersForSequence.receive(context);

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

    it('should throw error when sequence ID is missing', async () => {
        context.messages.in.content = {
            outputType: 'array'
        };
        context.properties = {};

        try {
            await FindSubscribersForSequence.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Sequence ID is required'), `Expected error message to contain "Sequence ID is required", got: ${error.message}`);
        }
    });
});
