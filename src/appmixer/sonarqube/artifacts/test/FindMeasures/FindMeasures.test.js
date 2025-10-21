const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../../test/utils.js');
const action = require('../../../core/FindMeasures/FindMeasures.js');

describe('FindMeasures', function() {

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
                measures: [
                    {
                        metric: 'complexity',
                        value: '12',
                        component: 'MY_PROJECT_1',
                        bestValue: false
                    },
                    {
                        metric: 'complexity',
                        value: '35',
                        component: 'MY_PROJECT_2',
                        bestValue: false
                    },
                    {
                        metric: 'ncloc',
                        value: '114',
                        component: 'MY_PROJECT_1',
                        bestValue: false
                    },
                    {
                        metric: 'ncloc',
                        value: '217',
                        component: 'MY_PROJECT_2',
                        bestValue: false
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
                        metricKeys: 'ncloc,complexity',
                        projectKeys: 'MY_PROJECT_1,MY_PROJECT_2'
                    }
                }
            };

            await action.receive(context);

            // Assert that httpRequest was called with correct parameters
            assert.strictEqual(context.httpRequest.callCount, 1);

            const requestOptions = context.httpRequest.args[0][0];
            assert.strictEqual(requestOptions.method, 'GET');
            assert.strictEqual(requestOptions.url, 'https://sonarqube.example.com/api/measures/search');

            const params = requestOptions.params;
            assert.strictEqual(params.metricKeys, 'ncloc,complexity');
            assert.strictEqual(params.projectKeys, 'MY_PROJECT_1,MY_PROJECT_2');

            // Check auth header
            const authHeader = requestOptions.headers.Authorization;
            assert.ok(authHeader.startsWith('Bearer '));

            // Assert that sendJson was called with the response data
            assert.strictEqual(context.sendJson.callCount, 1);
            assert.deepStrictEqual(context.sendJson.args[0][0], mockResponse.data);
            assert.strictEqual(context.sendJson.args[0][1], 'out');
        });
    });
});
