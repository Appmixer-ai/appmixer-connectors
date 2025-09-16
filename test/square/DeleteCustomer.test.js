'use strict';

const assert = require('assert');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const componentPath = '../../src/appmixer/square/core/DeleteCustomer/DeleteCustomer';
const component = require(componentPath);
const { createMockContext } = require('../utils');

describe('Square -> DeleteCustomer', () => {

    let context;

    beforeEach(() => {
        context = createMockContext({
            auth: {
                accessToken: process.env.SQUARE_ACCESS_TOKEN
            }
        });

        // Mock successful deletion response (empty response body)
        const mockSquareResponse = {
            data: {}
        };

        context.httpRequest.resolves(mockSquareResponse);

        // Make sendJson return a value
        context.sendJson.returns({ success: true });
    });

    it('should delete a customer by ID', async () => {

        const testData = {
            customer_id: 'CUST_123'
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        // Check that httpRequest was called with correct parameters
        assert.strictEqual(context.httpRequest.callCount, 1, 'httpRequest should be called once');
        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(httpArgs.method, 'DELETE', 'Should use DELETE method');
        assert.strictEqual(httpArgs.url, 'https://connect.squareup.com/v2/customers/CUST_123', 'Should call customer delete endpoint');
        assert(httpArgs.headers.Authorization.includes('Bearer'), 'Should include Bearer token');
        assert.strictEqual(httpArgs.headers['Square-Version'], '2025-08-20', 'Should include Square-Version header');

        // Check that sendJson was called with empty response
        assert.strictEqual(context.sendJson.callCount, 1, 'sendJson should be called once');
        const sendJsonArgs = context.sendJson.getCall(0).args;
        assert.deepStrictEqual(sendJsonArgs[0], {}, 'Should send empty object');
        assert.strictEqual(sendJsonArgs[1], 'out', 'Should send to out port');
    });

    it('should delete a customer with version parameter', async () => {

        const testData = {
            customer_id: 'CUST_456',
            version: 11
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(httpArgs.method, 'DELETE', 'Should use DELETE method');
        assert.strictEqual(httpArgs.url, 'https://connect.squareup.com/v2/customers/CUST_456?version=11', 'Should include version query parameter');
    });

    it('should not include version parameter when not provided', async () => {

        const testData = {
            customer_id: 'CUST_789'
            // version not provided
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(httpArgs.url, 'https://connect.squareup.com/v2/customers/CUST_789', 'Should not include version query parameter');
    });

    it('should not include version parameter when empty string', async () => {

        const testData = {
            customer_id: 'CUST_101',
            version: '' // Empty string
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(httpArgs.url, 'https://connect.squareup.com/v2/customers/CUST_101', 'Should not include version when empty string');
    });

    it('should throw error when customer_id is missing', async () => {

        const testData = {
            version: 5
            // customer_id missing
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Customer ID is required'), 'Should throw validation error');
            assert.strictEqual(context.httpRequest.callCount, 0, 'httpRequest should not be called');
        }
    });

    it('should use sandbox URL when environment is sandbox', async () => {

        context.config = { environment: 'sandbox' };

        const testData = {
            customer_id: 'CUST_SANDBOX'
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(httpArgs.url, 'https://connect.squareupsandbox.com/v2/customers/CUST_SANDBOX', 'Should use sandbox URL');
    });

    it('should handle API errors gracefully', async () => {

        // Mock an API error response
        const apiError = new Error('API Error');
        apiError.response = {
            data: {
                errors: [
                    {
                        category: 'INVALID_REQUEST_ERROR',
                        code: 'NOT_FOUND',
                        detail: 'Customer not found'
                    }
                ]
            }
        };

        context.httpRequest.rejects(apiError);

        const testData = {
            customer_id: 'INVALID_CUSTOMER'
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.strictEqual(error.message, 'API Error', 'Should throw the API error');
            assert.strictEqual(context.sendJson.callCount, 0, 'sendJson should not be called when error is thrown');
        }
    });

    it('should properly encode customer ID in URL', async () => {

        const testData = {
            customer_id: 'CUST@123#456' // Special characters
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert(httpArgs.url.includes('CUST%40123%23456'), 'Should URL encode customer ID');
    });

    it('should properly encode version in query parameter', async () => {

        const testData = {
            customer_id: 'CUST_123',
            version: 999999999999999 // Large number
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert(httpArgs.url.includes('version=999999999999999'), 'Should properly encode large version number');
    });
});
