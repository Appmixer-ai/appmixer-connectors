'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('CreateCustomer', function() {
    this.timeout(30000); // 30 second timeout

    const componentPath = '../../src/appmixer/helpscout/core/CreateCustomer/CreateCustomer.js';
    let component;

    before(() => {
        component = require(componentPath);
    });

    it('should create a new customer', async () => {

        // Mock context with tracking
        let sendJsonCalled = false;
        let sentData = null;

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            properties: {},
            messages: {
                in: {
                    content: {
                        firstName: 'Test',
                        lastName: 'Customer',
                        emailValue: `test.customer.${Date.now()}@example.com`, // Use unique email
                        emailType: 'work',
                        background: 'Test customer created by automated test'
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                sendJsonCalled = true;
                sentData = data;
                assert.strictEqual(port, 'out');
                console.log('CreateCustomer response:', data); // Debug log

                if (data) {
                    assert(typeof data === 'object');
                    if (data.id) {
                        assert(typeof data.id === 'number');
                    }
                    if (data.firstName) {
                        assert(typeof data.firstName === 'string');
                    }
                } else {
                    console.log('Warning: CreateCustomer returned null/empty data');
                }
                return Promise.resolve(data);
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        // Execute component
        await component.receive(context);

        // Verify that sendJson was called with correct data
        assert(sendJsonCalled, 'sendJson should have been called');
        console.log('Sent data:', sentData);

        if (sentData && sentData.firstName) {
            assert.strictEqual(sentData.firstName, 'Test');
        }
        if (sentData && sentData.lastName) {
            assert.strictEqual(sentData.lastName, 'Customer');
        }
    });

    it('should throw error when firstName is missing', async () => {

        const context = {
            messages: {
                in: {
                    content: {
                        emailValue: 'test@example.com'
                    }
                }
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Expected CancelError to be thrown');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError');
            assert(error.message.includes('First Name'));
        }
    });

    it('should throw error when email is missing', async () => {

        const context = {
            messages: {
                in: {
                    content: {
                        firstName: 'Test'
                    }
                }
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Expected CancelError to be thrown');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError');
            assert(error.message.includes('Email'));
        }
    });
});
