const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils.js');
const action = require('../../../src/appmixer/sonarqube/core/FindMeasureHistory/FindMeasureHistory.js');

describe('FindMeasureHistory', function() {

    let context;

    beforeEach(function() {
        context = testUtils.createMockContext();
        context.auth = {
            serverUrl: 'https://sonarqube.example.com',
            apiKey: 'test-api-key'
        };
        context.messages = { in: { content: {} } };
        sinon.reset();
    });

    describe('receive', function() {

        const mockResponse = {
            data: {
                paging: {
                    pageIndex: 1,
                    pageSize: 100,
                    total: 3
                },
                measures: [
                    {
                        metric: 'complexity',
                        history: [
                            {
                                date: '2023-01-23T17:00:53+0100',
                                value: '45'
                            },
                            {
                                date: '2023-01-24T17:00:53+0100',
                                value: '45'
                            },
                            {
                                date: '2023-01-25T17:00:53+0100',
                                value: '45'
                            }
                        ]
                    },
                    {
                        metric: 'ncloc',
                        history: [
                            {
                                date: '2023-01-23T17:00:53+0100',
                                value: '47'
                            },
                            {
                                date: '2023-01-24T17:00:53+0100',
                                value: '47'
                            },
                            {
                                date: '2023-01-25T17:00:53+0100',
                                value: '47'
                            }
                        ]
                    }
                ]
            }
        };

        beforeEach(function() {
            // Stub httpRequest
            context.httpRequest = sinon.stub().resolves(mockResponse);
        });

        it('should call httpRequest with correct parameters', async function() {
            // Set input message
            context.messages = {
                in: {
                    content: {
                        component: 'my_project',
                        metrics: 'ncloc,complexity',
                        branch: 'main',
                        from: '2023-01-01',
                        to: '2023-01-31'
                    }
                }
            };

            await action.receive(context);

            // Assert that httpRequest was called with correct parameters
            assert.strictEqual(context.httpRequest.callCount, 1);

            const requestOptions = context.httpRequest.args[0][0];
            assert.strictEqual(requestOptions.method, 'GET');
            assert.strictEqual(requestOptions.url, 'https://sonarqube.example.com/api/measures/search_history');

            const params = requestOptions.params;
            assert.strictEqual(params.component, 'my_project');
            assert.strictEqual(params.metrics, 'ncloc,complexity');
            assert.strictEqual(params.branch, 'main');
            assert.strictEqual(params.from, '2023-01-01');
            assert.strictEqual(params.to, '2023-01-31');

            // Check auth header
            const authHeader = requestOptions.headers.Authorization;
            assert.ok(authHeader.startsWith('Bearer '));

            // Assert that sendJson was called with the response data
            assert.strictEqual(context.sendJson.callCount, 1);
            assert.deepStrictEqual(context.sendJson.args[0][0], mockResponse.data);
            assert.strictEqual(context.sendJson.args[0][1], 'out');
        });

        it('should handle missing optional parameters', async function() {
            // Set input message with only required parameters
            context.messages = {
                in: {
                    content: {
                        component: 'my_project',
                        metrics: 'ncloc,complexity'
                    }
                }
            };

            await action.receive(context);

            // Assert that httpRequest was called with correct parameters
            assert.strictEqual(context.httpRequest.callCount, 1);

            const requestOptions = context.httpRequest.args[0][0];
            const params = requestOptions.params;
            assert.strictEqual(params.component, 'my_project');
            assert.strictEqual(params.metrics, 'ncloc,complexity');
            assert.strictEqual(params.branch, undefined);
            assert.strictEqual(params.from, undefined);
            assert.strictEqual(params.to, undefined);
        });
    });
});
