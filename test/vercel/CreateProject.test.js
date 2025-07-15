const assert = require('assert');

describe('CreateProject', () => {
    let component;

    before(() => {
        component = require('../../src/appmixer/vercel/core/CreateProject/CreateProject');
    });

    it('should create a project with required name', async () => {
        const projectName = `test-project-${Date.now()}`;
        const mockResponse = {
            id: 'prj_test123',
            name: projectName,
            framework: 'nextjs',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const context = {
            messages: {
                in: {
                    content: {
                        name: projectName,
                        framework: 'nextjs'
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate the request structure
                assert.strictEqual(options.method, 'POST');
                assert(options.url.includes('/v9/projects'));
                assert(options.data);
                assert.strictEqual(options.data.name, projectName);
                assert.strictEqual(options.data.framework, 'nextjs');
                assert(options.headers['Authorization'].includes('Bearer'));
                assert.strictEqual(options.headers['Content-Type'], 'application/json');

                // Return mock response
                return { data: mockResponse };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.id, mockResponse.id);
                assert.strictEqual(data.name, projectName);
                assert.strictEqual(data.framework, 'nextjs');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should throw error when name is missing', async () => {
        const context = {
            messages: {
                in: {
                    content: {}
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error
        };

        try {
            await component.receive(context);
            assert.fail('Expected error for missing name');
        } catch (error) {
            assert(error.message.includes('Project name is required'));
        }
    });

    it('should handle team parameter', async () => {
        const projectName = `test-team-project-${Date.now()}`;
        const teamId = 'team_test123';
        const mockResponse = {
            id: 'prj_team_test456',
            name: projectName,
            teamId: teamId,
            createdAt: Date.now()
        };

        const context = {
            messages: {
                in: {
                    content: {
                        name: projectName,
                        teamId: teamId
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate team parameter is included in URL
                assert(options.url.includes(`teamId=${teamId}`));
                assert.strictEqual(options.method, 'POST');
                assert(options.data);
                assert.strictEqual(options.data.name, projectName);

                return { data: mockResponse };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.id, mockResponse.id);
                assert.strictEqual(data.name, projectName);
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });
});
