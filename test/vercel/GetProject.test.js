const assert = require('assert');

describe('GetProject', () => {
    let component;

    before(() => {
        component = require('../../src/appmixer/vercel/core/GetProject/GetProject');
    });

    it('should get project by ID', async () => {
        const projectId = 'test-project-id';
        const mockProject = {
            id: projectId,
            name: 'test-project',
            framework: 'nextjs',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            link: {
                type: 'github',
                repo: 'test/repo'
            }
        };

        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate request structure
                assert.strictEqual(options.method, 'GET');
                assert(options.url.includes(`/v9/projects/${projectId}`));
                assert(options.headers['Authorization'].includes('Bearer'));

                return { data: mockProject };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.id, projectId);
                assert.strictEqual(data.name, 'test-project');
                assert.strictEqual(data.framework, 'nextjs');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should throw error when ID is missing', async () => {
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
            assert.fail('Expected error for missing ID');
        } catch (error) {
            assert(error.message.includes('Project ID is required'));
        }
    });

    it('should handle team parameter', async () => {
        const projectId = 'test-project-id';
        const teamId = 'team_test123';
        const mockProject = {
            id: projectId,
            name: 'team-project',
            teamId: teamId
        };

        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId,
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
                assert.strictEqual(options.method, 'GET');
                assert(options.url.includes(`/v9/projects/${projectId}`));

                return { data: mockProject };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.id, projectId);
                assert.strictEqual(data.teamId, teamId);
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should properly encode project ID in URL', async () => {
        const projectId = 'project with spaces';
        const encodedProjectId = encodeURIComponent(projectId);
        const mockProject = {
            id: projectId,
            name: 'encoded-project'
        };

        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate that project ID is properly encoded in URL
                assert(options.url.includes(encodedProjectId));
                assert.strictEqual(options.method, 'GET');

                return { data: mockProject };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.id, projectId);
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });
});
