const assert = require('assert');

describe('UpdateProject', () => {
    let component;

    before(() => {
        component = require('../../src/appmixer/vercel/core/UpdateProject/UpdateProject');
    });

    it('should update project with provided fields', async () => {
        const projectId = 'test-project-id';
        const newName = 'updated-project-name';
        const mockUpdatedProject = {
            id: projectId,
            name: newName,
            devCommand: 'npm run dev-updated',
            updatedAt: Date.now()
        };

        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId,
                        name: newName,
                        devCommand: 'npm run dev-updated'
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate request structure
                assert.strictEqual(options.method, 'PATCH');
                assert(options.url.includes(`/v9/projects/${projectId}`));
                assert(options.data);
                assert.strictEqual(options.data.name, newName);
                assert.strictEqual(options.data.devCommand, 'npm run dev-updated');
                assert(options.headers['Authorization'].includes('Bearer'));
                assert.strictEqual(options.headers['Content-Type'], 'application/json');

                return { data: mockUpdatedProject };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.id, projectId);
                assert.strictEqual(data.name, newName);
                assert.strictEqual(data.devCommand, 'npm run dev-updated');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should throw error when ID is missing', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        name: 'new-name'
                    }
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

    it('should only include defined fields in request body', async () => {
        const projectId = 'test-project-id';
        const mockUpdatedProject = {
            id: projectId,
            name: 'new-name',
            updatedAt: Date.now()
        };

        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId,
                        name: 'new-name'
                        // Other fields are undefined/null
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate that only defined fields are included
                assert(options.data);
                assert.strictEqual(options.data.name, 'new-name');
                assert(!Object.hasOwn(options.data, 'devCommand'));
                assert(!Object.hasOwn(options.data, 'buildCommand'));
                assert(!Object.hasOwn(options.data, 'framework'));
                assert.strictEqual(options.method, 'PATCH');

                return { data: mockUpdatedProject };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.id, projectId);
                assert.strictEqual(data.name, 'new-name');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should handle boolean values correctly', async () => {
        const projectId = 'test-project-id';
        const mockUpdatedProject = {
            id: projectId,
            publicSource: false,
            updatedAt: Date.now()
        };

        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId,
                        publicSource: false
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate boolean value is correctly included
                assert(options.data);
                assert.strictEqual(options.data.publicSource, false);
                assert.strictEqual(options.method, 'PATCH');

                return { data: mockUpdatedProject };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.id, projectId);
                assert.strictEqual(data.publicSource, false);
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });
});
