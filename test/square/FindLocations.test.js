'use strict';

const assert = require('assert');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const componentPath = '../../src/appmixer/square/core/FindLocations/FindLocations';
const component = require(componentPath);
const { createMockContext } = require('../utils');

describe('Square -> FindLocations', () => {

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
                locations: [
                    {
                        id: 'LOC_123',
                        name: 'Main Store',
                        address: {
                            address_line_1: '123 Main St',
                            locality: 'San Francisco',
                            administrative_district_level_1: 'CA'
                        }
                    },
                    {
                        id: 'LOC_456',
                        name: 'Branch Store',
                        address: {
                            address_line_1: '456 Branch Ave',
                            locality: 'Los Angeles',
                            administrative_district_level_1: 'CA'
                        }
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

    it('should find locations', async () => {

        const testData = {
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
        assert.strictEqual(httpArgs.method, 'GET', 'Should use GET method');
        assert(httpArgs.url.includes('/v2/locations'), 'Should call locations endpoint');
        assert(httpArgs.headers.Authorization.includes('Bearer'), 'Should include Bearer token');

        // Check return value
        assert(result, 'Should return a result');
        assert.strictEqual(result.success, true, 'Should return success');
    });
});
