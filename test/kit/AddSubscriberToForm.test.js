const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('AddSubscriberToForm', () => {

    let AddSubscriberToForm;
    let CreateSubscriber;
    let FindForms;
    let context;
    let testSubscriberId;
    let testFormId;

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

        AddSubscriberToForm = require('../../src/appmixer/kit/form/AddSubscriberToForm/AddSubscriberToForm');
        CreateSubscriber = require('../../src/appmixer/kit/subscriber/CreateSubscriber/CreateSubscriber');
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

        // Create a test subscriber first
        const testEmail = `test-addform+${Date.now()}@example.com`;
        context.messages.in.content = {
            email: testEmail,
            firstName: 'AddForm',
            state: 'active'
        };

        const createSubscriberResult = await CreateSubscriber.receive(context);
        testSubscriberId = createSubscriberResult.data.id;

        // Get available forms
        context.messages.in.content = {};
        context.properties = { isSource: true };

        const findFormsResult = await FindForms.receive(context);
        if (findFormsResult.data.result.length === 0) {
            console.log('No forms available for testing AddSubscriberToForm');
            this.skip();
        }

        testFormId = findFormsResult.data.result[0].id;
        context.properties = {}; // Reset properties
    });

    it('should add subscriber to form successfully', async () => {
        context.messages.in.content = {
            formId: testFormId.toString(),
            subscriberId: testSubscriberId.toString()
        };

        try {
            const result = await AddSubscriberToForm.receive(context);

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
            formId: testFormId.toString()
        };

        try {
            await AddSubscriberToForm.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Subscriber ID is required'), `Expected error message to contain "Subscriber ID is required", got: ${error.message}`);
        }
    });

    it('should throw error when form ID is missing', async () => {
        context.messages.in.content = {
            subscriberId: testSubscriberId.toString()
        };

        try {
            await AddSubscriberToForm.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Form ID is required'), `Expected error message to contain "Form ID is required", got: ${error.message}`);
        }
    });
});
