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

    it('should create a customer with company name only', async () => {

        const testData = {
            company_name: 'Test Company Inc.'
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(httpArgs.data.company_name, 'Test Company Inc.', 'Should send company name');
        assert.strictEqual(context.httpRequest.callCount, 1, 'httpRequest should be called once');
    });

    it('should create a customer with phone number only', async () => {

        const testData = {
            phone_number: '+1234567890'
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(httpArgs.data.phone_number, '+1234567890', 'Should send phone number');
        assert.strictEqual(context.httpRequest.callCount, 1, 'httpRequest should be called once');
    });

    it('should throw error when no required fields are provided', async () => {

        const testData = {}; // No fields provided

        context.messages = {
            in: {
                content: testData
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('At least one of the following fields is required'), 'Should throw validation error');
            assert.strictEqual(context.httpRequest.callCount, 0, 'httpRequest should not be called');
        }
    });

    it('should not include empty fields in request', async () => {

        const testData = {
            given_name: 'John',
            family_name: '', // Empty string
            email_address: 'john@example.com'
            // company_name and phone_number not provided
        };

        context.messages = {
            in: {
                content: testData
            }
        };

        await component.receive(context);

        const httpArgs = context.httpRequest.getCall(0).args[0];
        assert.strictEqual(httpArgs.data.given_name, 'John', 'Should include given name');
        assert.strictEqual(httpArgs.data.email_address, 'john@example.com', 'Should include email');
        assert.strictEqual(httpArgs.data.family_name, undefined, 'Should not include empty family name');
        assert.strictEqual(httpArgs.data.company_name, undefined, 'Should not include undefined company name');
        assert.strictEqual(httpArgs.data.phone_number, undefined, 'Should not include undefined phone number');
    });
});
