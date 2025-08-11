const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('FindSubscribersForForm', () => {

    let FindSubscribersForForm;
    let CreateSubscriber;
    let FindForms;
    let AddSubscriberToForm;
    let context;
    let testFormId;

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

        FindSubscribersForForm = require('../../src/appmixer/kit/form/FindSubscribersForForm/FindSubscribersForForm');
        CreateSubscriber = require('../../src/appmixer/kit/subscriber/CreateSubscriber/CreateSubscriber');
        FindForms = require('../../src/appmixer/kit/form/FindForms/FindForms');
        AddSubscriberToForm = require('../../src/appmixer/kit/form/AddSubscriberToForm/AddSubscriberToForm');

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

        // Get available forms
        context.messages.in.content = {};
        context.properties = { isSource: true };

        const findFormsResult = await FindForms.receive(context);
        if (findFormsResult.data.result.length === 0) {
            console.log('No forms available for testing FindSubscribersForForm');
            this.skip();
        }

        testFormId = findFormsResult.data.result[0].id;
        context.properties = {}; // Reset properties

        // Create a test subscriber and add to form
        const testEmail = `test-findformsubs+${Date.now()}@example.com`;
        context.messages.in.content = {
            email: testEmail,
            firstName: 'FindFormSubs',
            state: 'active'
        };

        const createSubscriberResult = await CreateSubscriber.receive(context);
        const testSubscriberId = createSubscriberResult.data.id;

        // Add subscriber to form
        context.messages.in.content = {
            formId: testFormId.toString(),
            subscriberId: testSubscriberId.toString()
        };

        await AddSubscriberToForm.receive(context);
    });

    it('should find subscribers for form as array', async () => {
        context.messages.in.content = {
            formId: testFormId.toString(),
            outputType: 'array'
        };

        try {
            const result = await FindSubscribersForForm.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');

            if (result.port === 'notFound') {
                // No subscribers found, which is valid for some forms
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
            formId: testFormId.toString(),
            outputType: 'array'
        };
        context.properties = {
            generateOutputPortOptions: true
        };

        try {
            const result = await FindSubscribersForForm.receive(context);

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

    it('should throw error when form ID is missing', async () => {
        context.messages.in.content = {
            outputType: 'array'
        };
        context.properties = {};

        try {
            await FindSubscribersForForm.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Form ID is required'), `Expected error message to contain "Form ID is required", got: ${error.message}`);
        }
    });
});
