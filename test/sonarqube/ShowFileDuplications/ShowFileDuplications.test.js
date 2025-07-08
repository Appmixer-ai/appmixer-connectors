const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils.js');
const action = require('../../../src/appmixer/sonarqube/core/ShowFileDuplications/ShowFileDuplications.js');

describe('ShowFileDuplications', function() {

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
                duplications: [
                    {
                        blocks: [
                            {
                                from: 94,
                                size: 101,
                                _ref: '1'
                            },
                            {
                                from: 83,
                                size: 101,
                                _ref: '2'
                            }
                        ]
                    },
                    {
                        blocks: [
                            {
                                from: 38,
                                size: 40,
                                _ref: '1'
                            },
                            {
                                from: 29,
                                size: 39,
                                _ref: '2'
                            }
                        ]
                    }
                ],
                files: {
                    '1': {
                        key: 'org.example:project:src/main/java/org/example/utils/FileUtils.java',
                        name: 'FileUtils',
                        projectName: 'Example Project'
                    },
                    '2': {
                        key: 'org.example:another-project:src/main/java/org/example/utils/FileUtils.java',
                        name: 'FileUtils',
                        projectName: 'Another Project'
                    }
                }
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
                        key: 'my_project:/src/foo/Bar.php'
                    }
                }
            };

            await action.receive(context);

            // Assert that httpRequest was called with correct parameters
            assert.strictEqual(context.httpRequest.callCount, 1);

            const requestOptions = context.httpRequest.args[0][0];
            assert.strictEqual(requestOptions.method, 'GET');
            assert.strictEqual(requestOptions.url, 'https://sonarqube.example.com/api/duplications/show');

            const params = requestOptions.params;
            assert.strictEqual(params.key, 'my_project:/src/foo/Bar.php');

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
