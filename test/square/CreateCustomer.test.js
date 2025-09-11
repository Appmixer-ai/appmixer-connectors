'use strict';

const assert = require('assert');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const componentPath = '../../src/appmixer/square/core/CreateCustomer/CreateCustomer';
const component = require(componentPath);
const { createMockContext } = require('../utils');

describe('Square -> CreateCustomer', () => {

    let context;

    beforeEach(() => {
        context = createMockContext({
            auth: {
                accessToken: process.env.SQUARE_ACCESS_TOKEN
            }
        });

        // Mock the httpRequest to return a Square API response
        const mockSquareResponse = {
            data: {
                customer: {
                    id: 'CUST_123',
                    given_name: 'Test',
                    family_name: 'User',
                    email_address: 'test@example.com',
                    created_at: '2025-08-20T12:00:00.000Z'
                }
            }
        };

        context.httpRequest.resolves(mockSquareResponse);

        // Make sendJson return a value
        context.sendJson.returns({ success: true });
    });

    it('should create a customer', async () => {

        const testData = {
            given_name: 'Test',
            family_name: 'User',
            email_address: 'test@example.com'
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
        assert.strictEqual(httpArgs.method, 'POST', 'Should use POST method');
        assert.strictEqual(httpArgs.url, 'https://connect.squareup.com/v2/customers', 'Should call customers endpoint');
        assert(httpArgs.headers.Authorization.includes('Bearer'), 'Should include Bearer token');
        assert(httpArgs.data.given_name, 'Should send customer data');

        // Check that sendJson was called
        assert.strictEqual(context.sendJson.callCount, 1, 'sendJson should be called once');
        const sendJsonArgs = context.sendJson.getCall(0).args;
        assert(sendJsonArgs[0], 'Should have sent customer data');
        assert.strictEqual(sendJsonArgs[1], 'out', 'Should send to out port');
    });
});
