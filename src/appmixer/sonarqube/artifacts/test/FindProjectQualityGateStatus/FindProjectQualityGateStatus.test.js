const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../../test/utils.js');
const action = require('../../../core/FindProjectQualityGateStatus/FindProjectQualityGateStatus.js');

describe('FindProjectQualityGateStatus', function() {

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
                projectStatus: {
                    status: 'ERROR',
                    ignoredConditions: false,
                    caycStatus: 'non-compliant',
                    conditions: [
                        {
                            status: 'ERROR',
                            metricKey: 'new_coverage',
                            comparator: 'LT',
                            errorThreshold: '85',
                            actualValue: '82.50562381034781'
                        },
                        {
                            status: 'OK',
                            metricKey: 'new_sqale_debt_ratio',
                            comparator: 'GT',
                            errorThreshold: '5',
                            actualValue: '0.6562109862671661'
                        }
                    ],
                    period: {
                        mode: 'last_version',
                        date: '2023-04-27T00:45:23+0200',
                        parameter: '2023-04-25'
                    }
                }
            }
        };

        beforeEach(function() {
            // Stub httpRequest
            context.httpRequest = sinon.stub().resolves(mockResponse);
        });

        it('should call httpRequest with correct parameters using projectKey', async function() {
            // Set input message
            context.messages = {
                in: {
                    content: {
                        projectKey: 'my_project',
                        branch: 'main'
                    }
                }
            };

            await action.receive(context);

            // Assert that httpRequest was called with correct parameters
            assert.strictEqual(context.httpRequest.callCount, 1);

            const requestOptions = context.httpRequest.args[0][0];
            assert.strictEqual(requestOptions.method, 'GET');
            assert.strictEqual(requestOptions.url, 'https://sonarqube.example.com/api/qualitygates/project_status');

            const params = requestOptions.params;
            assert.strictEqual(params.projectKey, 'my_project');
            assert.strictEqual(params.branch, 'main');
            assert.strictEqual(params.analysisId, undefined);
            assert.strictEqual(params.projectId, undefined);
            assert.strictEqual(params.pullRequest, undefined);

            // Check auth header
            const authHeader = requestOptions.headers.Authorization;
            assert.ok(authHeader.startsWith('Bearer '));

            // Assert that sendJson was called with the unwrapped projectStatus object
            assert.strictEqual(context.sendJson.callCount, 1);
            assert.deepStrictEqual(context.sendJson.args[0][0], mockResponse.data.projectStatus);
            assert.strictEqual(context.sendJson.args[0][1], 'out');
        });

        it('should call httpRequest with correct parameters using analysisId', async function() {
            // Set input message
            context.messages = {
                in: {
                    content: {
                        analysisId: 'analysis-123'
                    }
                }
            };

            await action.receive(context);

            // Assert that httpRequest was called with correct parameters
            assert.strictEqual(context.httpRequest.callCount, 1);

            const requestOptions = context.httpRequest.args[0][0];
            const params = requestOptions.params;
            assert.strictEqual(params.analysisId, 'analysis-123');
            assert.strictEqual(params.projectKey, undefined);
            assert.strictEqual(params.branch, undefined);
        });
    });
});
