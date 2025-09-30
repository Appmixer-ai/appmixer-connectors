'use strict';

const assert = require('assert');
const { checkAccessTokenOrSkip } = require('./testHelper');

describe('UpdateCustomer', function() {
    this.timeout(30000); // 30 second timeout

    const componentPath = '../../src/appmixer/helpscout/core/UpdateCustomer/UpdateCustomer.js';
    let component;

    before(function() {
        // Skip all tests if no access token is available
        checkAccessTokenOrSkip(this);
        component = require(componentPath);
    });

    it('should update customer', async () => {

        // First get a customer ID
        const listResponse = await require('./httpRequest.js')({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/customers',
            headers: {
                'Authorization': `Bearer ${process.env.HELPSCOUT_ACCESS_TOKEN}`
            }
        });

        const customers = listResponse.data['_embedded']?.customers || [];
        if (customers.length === 0) {
            console.log('No customers found, skipping test');
            return;
        }

        const customerId = customers[0].id;

        // Mock context
        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        id: customerId,
                        background: 'Updated background from test - ' + Date.now()
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                console.log('UpdateCustomer response:', JSON.stringify(data, null, 2));
                return data;
            },
            CancelError: class extends Error {}
        };

        // Execute component
        await component.receive(context);
        console.log(`Updated customer ${customerId}`);
    });

    it('should throw error when id is missing', async () => {

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        firstName: 'Test'
                        // Missing id
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: () => {},
            CancelError: class extends Error {}
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error for missing id');
        } catch (error) {
            assert(error.message.includes('Customer ID is required'));
        }
    });
});
