const sinon = require('sinon');
const testUtils = require('../utils.js');
const action = require('../../src/appmixer/sonarqube/core/FindProjectQualityGateStatus/FindProjectQualityGateStatus.js');

describe('FindProjectQualityGateStatus', function() {
    let context;
    beforeEach(function() {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        sinon.reset();
    });
    describe('receive', function() {
        beforeEach(function() {
            // Example response from SonarQube API docs for /api/qualitygates/project_status
            context.httpRequest = sinon.stub().resolves({
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
                            }
                        ],
                        period: {
                            mode: 'last_version',
                            date: '2000-04-27T00:45:23+0200',
                            parameter: '2015-12-07'
                        }
                    }
                }
            });
            context.auth = { serverUrl: 'https://sonar.example.com', apiKey: 'dummy' };
        });
        it('should retrieve the quality gate status for a project', async function() {
            context.messages = {
                in: {
                    content: {
                        analysisId: 'analysis_id',
                        branch: 'main',
                        projectId: 'project_uuid',
                        projectKey: 'my_project',
                        pullRequest: 'pr-123'
                    }
                }
            };
            await action.receive(context);
            sinon.assert.calledOnce(context.sendJson);
            sinon.assert.calledWith(context.sendJson, sinon.match.object, 'out');
            sinon.assert.calledOnce(context.httpRequest);
            sinon.assert.calledWith(context.httpRequest, sinon.match({
                method: 'GET',
                url: sinon.match(/\/api\/qualitygates\/project_status/),
                params: sinon.match({
                    analysisId: 'analysis_id',
                    branch: 'main',
                    projectId: 'project_uuid',
                    projectKey: 'my_project',
                    pullRequest: 'pr-123'
                })
            }));
        });
    });
});
