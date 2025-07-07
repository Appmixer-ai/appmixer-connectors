const sinon = require('sinon');
const testUtils = require('../utils.js');
const action = require('../../src/appmixer/sonarqube/core/FindMeasures/FindMeasures.js');

describe('FindMeasures', function() {
    let context;
    beforeEach(function() {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        sinon.reset();
    });
    describe('receive', function() {
        beforeEach(function() {
            // Example response from SonarQube API docs for /api/measures/search
            context.httpRequest = sinon.stub().resolves({
                data: {
                    measures: [
                        {
                            metric: 'complexity',
                            value: '12',
                            component: 'MY_PROJECT_1',
                            bestValue: false
                        },
                        {
                            metric: 'ncloc',
                            value: '114',
                            component: 'MY_PROJECT_1',
                            bestValue: false
                        }
                    ]
                }
            });
            context.auth = { serverUrl: 'https://sonar.example.com', apiKey: 'dummy' };
        });
        it('should retrieve measures for given metrics and projects', async function() {
            context.messages = {
                in: {
                    content: {
                        metricKeys: 'ncloc,complexity',
                        projectKeys: 'my_project,another_project'
                    }
                }
            };
            await action.receive(context);
            sinon.assert.calledOnce(context.sendJson);
            sinon.assert.calledWith(context.sendJson, sinon.match({ measures: sinon.match.array }), 'out');
            sinon.assert.calledOnce(context.httpRequest);
            sinon.assert.calledWith(context.httpRequest, sinon.match({
                method: 'GET',
                url: sinon.match(/\/api\/measures\/search/),
                params: sinon.match({
                    metricKeys: 'ncloc,complexity',
                    projectKeys: 'my_project,another_project'
                })
            }));
        });
    });
});
