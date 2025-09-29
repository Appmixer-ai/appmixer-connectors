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
                        email_address: 'john@example.com',
                        phone_number: '+1-555-0123',
                        reference_id: 'REF_123',
                        creation_source: 'THIRD_PARTY',
                        created_at: '2023-01-01T00:00:00Z',
                        updated_at: '2023-01-15T00:00:00Z',
                        company_name: 'Acme Corp',
                        group_ids: ['GROUP_123'],
                        segment_ids: ['SEGMENT_456'],
                        version: 1
                    }
                ]
            }
        };

        context.httpRequest.resolves(mockSquareResponse);
        context.sendJson.returns({ success: true });
    });

    it('should find customers with basic text search', async () => {
        // Text search is no longer supported by Square API - test that it makes a basic search
        context.messages = {
            in: {
                content: {
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        assert.equal(callArgs.url, 'https://connect.squareup.com/v2/customers/search');
        assert.deepEqual(callArgs.data, {}); // Should make a basic search with empty filter

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const sendJsonArgs = context.sendJson.firstCall.args[0];
        assert(sendJsonArgs.result);
        assert(Array.isArray(sendJsonArgs.result));
        assert.equal(sendJsonArgs.result.length, 1);
        assert.equal(sendJsonArgs.result[0].id, 'CUST_123');
    });

    it('should find customers with email filter', async () => {
        context.messages = {
            in: {
                content: {
                    emailAddress: 'john@example.com',
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        assert.equal(callArgs.url, 'https://connect.squareup.com/v2/customers/search');
        assert.deepEqual(callArgs.data, {
            query: {
                filter: {
                    email_address: {
                        fuzzy: 'john@example.com'
                    }
                }
            }
        });

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const sendJsonArgs = context.sendJson.firstCall.args[0];
        assert(sendJsonArgs.result);
        assert(Array.isArray(sendJsonArgs.result));
        assert.equal(sendJsonArgs.result.length, 1);
        assert.equal(sendJsonArgs.result[0].email_address, 'john@example.com');
    });

    it('should find customers with phone number filter', async () => {
        context.messages = {
            in: {
                content: {
                    phoneNumber: '+1-555-0123',
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        assert.equal(callArgs.url, 'https://connect.squareup.com/v2/customers/search');
        assert.deepEqual(callArgs.data, {
            query: {
                filter: {
                    phone_number: {
                        fuzzy: '+1-555-0123'
                    }
                }
            }
        });

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const sendJsonArgs = context.sendJson.firstCall.args[0];
        assert(sendJsonArgs.result);
        assert(Array.isArray(sendJsonArgs.result));
        assert.equal(sendJsonArgs.result.length, 1);
        assert.equal(sendJsonArgs.result[0].phone_number, '+1-555-0123');
    });

    it('should find customers with date range filters', async () => {

        context.messages = {
            in: {
                content: {
                    createdAtFrom: '2023-01-01T00:00:00Z',
                    createdAtTo: '2023-12-31T23:59:59Z',
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        assert.equal(callArgs.method, 'POST');
        assert.equal(callArgs.url, 'https://connect.squareup.com/v2/customers/search');
        assert.deepEqual(callArgs.data.query.filter.created_at, {
            start_at: '2023-01-01T00:00:00Z',
            end_at: '2023-12-31T23:59:59Z'
        });

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
    });

    it('should find customers with updated date range filters', async () => {

        context.messages = {
            in: {
                content: {
                    updatedAtFrom: '2023-01-01T00:00:00Z',
                    updatedAtTo: '2023-12-31T23:59:59Z',
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        assert.deepEqual(callArgs.data.query.filter.updated_at, {
            start_at: '2023-01-01T00:00:00Z',
            end_at: '2023-12-31T23:59:59Z'
        });
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
    });

    it('should find customers with limit', async () => {

        context.messages = {
            in: {
                content: {
                    query: 'test',
                    limit: 50,
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        assert.equal(callArgs.data.limit, 50);
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
    });

    it('should find customers with multiple filters combined', async () => {

        context.messages = {
            in: {
                content: {
                    emailAddress: 'john@example.com',
                    createdAtFrom: '2023-01-01T00:00:00Z',
                    limit: 25,
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        assert.deepEqual(callArgs.data.query.filter.email_address, { fuzzy: 'john@example.com' });
        assert.deepEqual(callArgs.data.query.filter.created_at, { start_at: '2023-01-01T00:00:00Z' });
        assert.equal(callArgs.data.limit, 25);
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
    });

    it('should handle empty filters gracefully', async () => {

        context.messages = {
            in: {
                content: {
                    query: '',
                    emailAddress: '   ',
                    phoneNumber: null,
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        // Should not include empty query or filter objects
        assert.equal(callArgs.data.query, undefined);
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
    });

    it('should generate output port options', async () => {

        context.properties = { generateOutputPortOptions: true };
        context.messages = {
            in: {
                content: { outputType: 'array' }
            }
        };

        await component.receive(context);

        // Should return output port options instead of making HTTP request
        assert(!context.httpRequest.called, 'httpRequest should not be called for output port options');
        assert(context.sendJson.calledOnce, 'sendJson should be called once for output port options');
    });

    it('should use sandbox URL when environment is sandbox', async () => {

        context.config.environment = 'sandbox';
        context.messages = {
            in: {
                content: {
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        assert(callArgs.url.includes('squareupsandbox.com'));
    });

    it('should use production URL when environment is production', async () => {

        context.config.environment = 'production';
        context.messages = {
            in: {
                content: {
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const callArgs = context.httpRequest.firstCall.args[0];
        assert(callArgs.url.includes('squareup.com'));
        assert(!callArgs.url.includes('squareupsandbox.com'));
    });

    it('should handle empty customer response', async () => {

        context.httpRequest.resolves({ data: { customers: [] } });
        context.messages = {
            in: {
                content: {
                    query: 'nonexistent',
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const sendJsonArgs = context.sendJson.firstCall.args;
        assert.deepEqual(sendJsonArgs[0], {}, 'Should send empty object');
        assert.equal(sendJsonArgs[1], 'notFound', 'Should use notFound port');
    });

    it('should handle response without customers field', async () => {

        context.httpRequest.resolves({ data: {} });
        context.messages = {
            in: {
                content: {
                    query: 'test',
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const sendJsonArgs = context.sendJson.firstCall.args;
        assert.deepEqual(sendJsonArgs[0], {}, 'Should send empty object');
        assert.equal(sendJsonArgs[1], 'notFound', 'Should use notFound port');
    });

    it('should handle creation source and group IDs filters correctly', async () => {

        context.httpRequest.resolves({ data: { customers: [] } });
        context.messages = {
            in: {
                content: {
                    creationSource: 'CUSTOMERS_API',
                    groupIds: '1,2,3,4,5, 6,',
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        // Verify the request was made with the correct filter format
        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const httpRequestCall = context.httpRequest.firstCall.args[0];
        const requestBody = httpRequestCall.data;

        // Check creation_source filter format
        assert(requestBody.query.filter.creation_source, 'creation_source filter should be present');
        assert.deepEqual(requestBody.query.filter.creation_source.values, ['CUSTOMERS_API'], 'creation_source values should match');
        assert.equal(requestBody.query.filter.creation_source.rule, 'INCLUDE', 'creation_source rule should be INCLUDE');

        // Check group_ids filter format
        assert(requestBody.query.filter.group_ids, 'group_ids filter should be present');
        assert.deepEqual(requestBody.query.filter.group_ids.all, ['1', '2', '3', '4', '5', '6'], 'group_ids should be parsed correctly');

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
    });

    it('should handle group IDs as array from multiselect', async () => {

        context.httpRequest.resolves({ data: { customers: [] } });
        context.messages = {
            in: {
                content: {
                    groupIds: ['group1', 'group2', 'group3'],
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        // Verify the request was made with the correct filter format
        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const httpRequestCall = context.httpRequest.firstCall.args[0];
        const requestBody = httpRequestCall.data;

        // Check group_ids filter format
        assert(requestBody.query.filter.group_ids, 'group_ids filter should be present');
        assert.deepEqual(requestBody.query.filter.group_ids.all, ['group1', 'group2', 'group3'], 'group_ids should be an array');

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
    });

    it('should handle creation source as array from multiselect', async () => {

        context.httpRequest.resolves({ data: { customers: [] } });
        context.messages = {
            in: {
                content: {
                    creationSource: ['APPOINTMENTS', 'DIRECTORY', 'THIRD_PARTY'],
                    outputType: 'array'
                }
            }
        };

        await component.receive(context);

        // Verify the request was made with the correct filter format
        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');
        const httpRequestCall = context.httpRequest.firstCall.args[0];
        const requestBody = httpRequestCall.data;

        // Check creation_source filter format
        assert(requestBody.query.filter.creation_source, 'creation_source filter should be present');
        assert.deepEqual(requestBody.query.filter.creation_source.values, ['APPOINTMENTS', 'DIRECTORY', 'THIRD_PARTY'], 'creation_source values should be an array');
        assert.equal(requestBody.query.filter.creation_source.rule, 'INCLUDE', 'creation_source rule should be INCLUDE');

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
    });

});
