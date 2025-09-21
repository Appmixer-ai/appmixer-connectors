'use strict';

const assert = require('assert');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const componentPath = '../../src/appmixer/square/core/UpdateCustomer/UpdateCustomer';
const component = require(componentPath);
const { createMockContext } = require('../utils');

describe('Square -> UpdateCustomer', () => {

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
                    given_name: 'Updated',
                    family_name: 'User',
                    email_address: 'updated@example.com',
                    updated_at: '2023-10-18T12:00:00.000Z'
                }
            }
        };

        context.httpRequest.resolves(mockSquareResponse);
        context.sendJson.returns({ success: true });
    });

    it('should update a customer', async () => {

        const testData = {
            customer_id: 'CUST_123',
            given_name: 'Updated',
            email_address: 'updated@example.com'
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
        assert.strictEqual(httpArgs.method, 'PUT', 'Should use PUT method');
        assert(httpArgs.url.includes('/v2/customers/CUST_123'), 'Should call correct endpoint with customer ID');
        assert(httpArgs.headers.Authorization.includes('Bearer'), 'Should include Bearer token');
        assert(httpArgs.data.given_name, 'Should send updated customer data');

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
                content: {
                    given_name: 'Test'
                }
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
