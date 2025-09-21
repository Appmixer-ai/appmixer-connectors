'use strict';

const assert = require('assert');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const componentPath = '../../src/appmixer/square/core/GetCustomer/GetCustomer';
const component = require(componentPath);
const { createMockContext } = require('../utils');

describe('Square -> GetCustomer', () => {

    let context;

    beforeEach(() => {
        context = createMockContext({
            auth: {
                accessToken: process.env.SQUARE_ACCESS_TOKEN
            }
        });

        // Mock the httpRequest to return Square API response
        const mockSquareResponse = {
            data: {
                customer: {
                    id: 'CUST_123',
                    given_name: 'John',
                    family_name: 'Doe',
                    email_address: 'john@example.com',
                    created_at: '2025-08-20T12:00:00.000Z'
                }
            }
        };

        context.httpRequest.resolves(mockSquareResponse);
        context.sendJson.returns({ success: true });
    });

    it('should get a customer by ID', async () => {

        const testData = {
            customer_id: 'CUST_123'
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        const result = await component.receive(context);

        // Check that httpRequest was called with correct parameters
        assert.strictEqual(context.httpRequest.callCount, 1, 'httpRequest should be called once');
        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(httpArgs.method, 'GET', 'Should use GET method');
        assert.strictEqual(httpArgs.url, 'https://connect.squareup.com/v2/customers/CUST_123', 'Should call correct endpoint with customer ID');
        assert(httpArgs.headers.Authorization.includes('Bearer'), 'Should include Bearer token');

        // Check that sendJson was called
        assert.strictEqual(context.sendJson.callCount, 1, 'sendJson should be called once');
        const sendJsonArgs = context.sendJson.getCall(0).args;
        assert(sendJsonArgs[0], 'Should have sent customer data');
        assert.strictEqual(sendJsonArgs[1], 'out', 'Should send to out port');

        // Check return value
        assert(result, 'Should return a result');
        assert.strictEqual(result.success, true, 'Should return success');
    });

    it('should throw error when customer_id is missing', async () => {

        context.messages = {
            in: {
                content: {}
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Customer ID is required'), 'Should throw meaningful error');
        }
    });
});
