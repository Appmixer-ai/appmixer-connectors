const sinon = require('sinon');
const testUtils = require('../utils.js');
const action = require('../../src/appmixer/sonarqube/core/ShowFileDuplications/ShowFileDuplications.js');

describe('ShowFileDuplications', function() {
    let context;
    beforeEach(function() {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        sinon.reset();
    });
    describe('receive', function() {
        beforeEach(function() {
            // Example response from SonarQube API docs for /api/duplications/show
            context.httpRequest = sinon.stub().resolves({
                data: {
                    duplications: [
                        {
                            blocks: [
                                { from: 94, size: 101, _ref: '1' },
                                { from: 83, size: 101, _ref: '2' }
                            ]
                        }
                    ],
                    files: {
                        '1': {
                            key: 'org.codehaus.sonar:sonar-plugin-api:src/main/java/org/sonar/api/utils/command/CommandExecutor.java',
                            name: 'CommandExecutor',
                            projectName: 'SonarQube'
                        },
                        '2': {
                            key: 'com.sonarsource.orchestrator:sonar-orchestrator:src/main/java/com/sonar/orchestrator/util/CommandExecutor.java',
                            name: 'CommandExecutor',
                            projectName: 'SonarSource :: Orchestrator'
                        }
                    }
                }
            });
            context.auth = { serverUrl: 'https://sonar.example.com', apiKey: 'dummy' };
        });
        it('should retrieve duplications for a file', async function() {
            context.messages = {
                in: {
                    content: {
                        key: 'my_project:/src/foo/Bar.php'
                    }
                }
            };
            await action.receive(context);
            sinon.assert.calledOnce(context.sendJson);
            sinon.assert.calledWith(context.sendJson, sinon.match({ duplications: sinon.match.array, files: sinon.match.object }), 'out');
            sinon.assert.calledOnce(context.httpRequest);
            sinon.assert.calledWith(context.httpRequest, sinon.match({
                method: 'GET',
                url: sinon.match(/\/api\/duplications\/show/),
                params: sinon.match({
                    key: 'my_project:/src/foo/Bar.php'
                })
            }));
        });
    });
});
