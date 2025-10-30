const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const CreateCustomer = require('../../src/appmixer/helpscout/core/CreateCustomer/CreateCustomer');

// Mock context with CancelError
const createMockContext = (auth, messages = {}) => {
    const context = {
        auth,
        messages,
        properties: {},
        httpRequest: async (options) => {
            const response = await axios({
                method: options.method || 'GET',
                url: options.url,
                headers: options.headers,
                data: options.data
            });

            return {
                data: response.data,
                status: response.status,
                headers: response.headers
            };
        },
        sendJson: (data, port) => {
            return { data, port };
        },
        CancelError: class CancelError extends Error {
            constructor(message) {
                super(message);
                this.name = 'CancelError';
            }
        }
    };
    
    return context;
};

describe('HelpScout CreateCustomer', () => {
    const auth = {
        accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
    };

    before(async function() {
        // Skip all tests if the access token is not set
        if (!auth.accessToken) { this.skip(); }
    });

    it('should throw error when firstName is missing', async () => {
        const context = createMockContext(auth, {
            in: { 
                content: { 
                    lastName: 'Test', 
                    emailValue: 'test@example.com' 
                } 
            }
        });

        try {
            await CreateCustomer.receive(context);
            assert.fail('Should have thrown an error for missing firstName');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError');
            assert(error.message.includes('First Name is required'));
        }
    });

    it('should throw error when lastName is missing', async () => {
        const context = createMockContext(auth, {
            in: { 
                content: { 
                    firstName: 'Test', 
                    emailValue: 'test@example.com' 
                } 
            }
        });

        try {
            await CreateCustomer.receive(context);
            assert.fail('Should have thrown an error for missing lastName');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError');
            assert(error.message.includes('Last Name is required'));
        }
    });

    it('should throw error when emailValue is missing', async () => {
        const context = createMockContext(auth, {
            in: { 
                content: { 
                    firstName: 'Test', 
                    lastName: 'User' 
                } 
            }
        });

        try {
            await CreateCustomer.receive(context);
            assert.fail('Should have thrown an error for missing emailValue');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError');
            assert(error.message.includes('Email Address is required'));
        }
    });
});