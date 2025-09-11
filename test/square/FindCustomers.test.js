'use strict';

const assert = require('assert');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const componentPath = '../../src/appmixer/square/core/FindCustomers/FindCustomers';
const component = require(componentPath);
const { createMockContext } = require('../utils');

describe('Square -> FindCustomers', () => {

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
                customers: [
                    {
                        id: 'CUST_123',
                        given_name: 'John',
                        family_name: 'Doe',
                        email_address: 'john@example.com'
                    },
                    {
                        id: 'CUST_456',
                        given_name: 'Jane',
                        family_name: 'Smith',
                        email_address: 'jane@example.com'
                    }
                ]
            }
        };

        context.httpRequest.resolves(mockSquareResponse);

        // Mock lib.sendArrayOutput
        const mockLib = require('../../src/appmixer/square/lib.generated');
        mockLib.sendArrayOutput = ({ context, records }) => {
            context.sendJson(records, 'out');
            return { success: true };
        };

        context.sendJson.returns({ success: true });
    });

    it('should find customers', async () => {

        const testData = {
            query: 'John',
            outputType: 'item'
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
        assert.strictEqual(httpArgs.method, 'POST', 'Should use POST method for search');
        assert.strictEqual(httpArgs.url, 'https://connect.squareup.com/v2/customers/search', 'Should call search endpoint');
        assert(httpArgs.headers.Authorization.includes('Bearer'), 'Should include Bearer token');
        assert(httpArgs.data.query, 'Should include query filter');

        // Check return value
        assert(result, 'Should return a result');
        assert.strictEqual(result.success, true, 'Should return success');
    });
});
