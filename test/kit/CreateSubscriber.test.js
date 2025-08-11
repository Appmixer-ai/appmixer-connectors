const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

describe('CreateSubscriber', () => {

    let CreateSubscriber;
    let context;

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.KIT_API_KEY) {
            console.log('Skipping tests - KIT_API_KEY not set');
            this.skip();
        }

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
    });

    it('should create subscriber successfully', async () => {
        const testEmail = `test-create+${Date.now()}@example.com`;

        context.messages.in.content = {
            email: testEmail,
            firstName: 'Create',
            state: 'active'
        };

        try {
            const result = await CreateSubscriber.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.id && typeof result.data.id === 'number', 'Expected result.data.id to be a number');
            assert.strictEqual(result.data.email_address, testEmail, `Expected email to match input. Got: ${result.data.email_address}, Expected: ${testEmail}`);
            assert.strictEqual(result.data.first_name, 'Create', 'Expected first name to match');
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

    it('should throw error when email is missing', async () => {
        context.messages.in.content = {
            firstName: 'Test'
        };

        try {
            await CreateSubscriber.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Email is required'), `Expected error message to contain "Email is required", got: ${error.message}`);
        }
    });

    it('should throw error when email is empty', async () => {
        context.messages.in.content = {
            email: '',
            firstName: 'Test'
        };

        try {
            await CreateSubscriber.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Email is required'), `Expected error message to contain "Email is required", got: ${error.message}`);
        }
    });
});
