const sinon = require('sinon');
const testUtils = require('../utils.js');
const action = require('../../src/appmixer/sonarqube/core/FindMeasureHistory/FindMeasureHistory.js');

describe('FindMeasureHistory', function() {
    let context;
    beforeEach(function() {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        sinon.reset();
    });
    describe('receive', function() {
        beforeEach(function() {
            // Example response from SonarQube API docs for /api/measures/search_history
            context.httpRequest = sinon.stub().resolves({
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
                                { date: '2017-01-23T17:00:53+0100', value: '45' },
                                { date: '2017-01-24T17:00:53+0100', value: '45' },
                                { date: '2017-01-25T17:00:53+0100', value: '45' }
                            ]
                        },
                        {
                            metric: 'ncloc',
                            history: [
                                { date: '2017-01-23T17:00:53+0100', value: '47' },
                                { date: '2017-01-24T17:00:53+0100', value: '47' },
                                { date: '2017-01-25T17:00:53+0100', value: '47' }
                            ]
                        }
                    ]
                }
            });
            context.auth = { serverUrl: 'https://sonar.example.com', apiKey: 'dummy' };
        });
        it('should retrieve historical measures for a component', async function() {
            context.messages = {
                in: {
                    content: {
                        component: 'my_project',
                        metrics: 'ncloc,coverage',
                        branch: 'main',
                        from: '2024-01-01',
                        to: '2024-12-31'
                    }
                }
            };
            await action.receive(context);
            sinon.assert.calledOnce(context.sendJson);
            sinon.assert.calledWith(context.sendJson, sinon.match({ paging: sinon.match.object, measures: sinon.match.array }), 'out');
            sinon.assert.calledOnce(context.httpRequest);
            sinon.assert.calledWith(context.httpRequest, sinon.match({
                method: 'GET',
                url: sinon.match(/\/api\/measures\/search_history/),
                params: sinon.match({
                    component: 'my_project',
                    metrics: 'ncloc,coverage',
                    branch: 'main',
                    from: '2024-01-01',
                    to: '2024-12-31'
                })
            }));
        });
    });
});
