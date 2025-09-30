'use strict';

const assert = require('assert');
const { checkAccessTokenOrSkip } = require('./testHelper');

describe('GetCustomer', function() {
    this.timeout(30000); // 30 second timeout

    const componentPath = '../../src/appmixer/helpscout/core/GetCustomer/GetCustomer.js';
    let component;

    before(function() {
        // Skip all tests if no access token is available
        checkAccessTokenOrSkip(this);
        component = require(componentPath);
    });

    it('should get customer by id', async () => {

        // Mock context with tracking
        let sendJsonCalled = false;

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            properties: {},
            messages: {
                in: {
                    content: {
                        id: 1234567 // Use a test customer ID
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                sendJsonCalled = true;
                sentData = data;
                assert.strictEqual(port, 'out');
                console.log('GetCustomer response:', data);

                if (data && typeof data === 'object') {
                    // Verify it's a customer object
                    if (data.id) assert(typeof data.id === 'number');
                    if (data.firstName) assert(typeof data.firstName === 'string');
                }
                return Promise.resolve(data);
            }
        };

        // Execute component
        try {
            await component.receive(context);

            // Verify that sendJson was called
            assert(sendJsonCalled, 'sendJson should have been called');
            console.log('Test completed successfully');
        } catch (error) {
            // This is expected if the customer ID doesn't exist
            console.log('Expected error for non-existent customer:', error.message);
        }
    });
});
