const assert = require('assert');

describe('FindDeployments', () => {
    let component;

    before(() => {
        component = require('../../src/appmixer/vercel/core/FindDeployments/FindDeployments');
    });

    it('should find deployments and return array output', async () => {
        const mockDeployments = {
            deployments: [
                {
                    uid: 'dpl_test123',
                    name: 'test-deployment',
                    state: 'READY',
                    url: 'test-deployment.vercel.app',
                    created: Date.now()
                },
                {
                    uid: 'dpl_test456',
                    name: 'another-deployment',
                    state: 'BUILDING',
                    url: 'another-deployment.vercel.app',
                    created: Date.now()
                }
            ],
            pagination: { count: 2, next: null, prev: null }
        };

        const context = {
            properties: {},
            messages: {
                in: {
                    content: {
                        outputType: 'array'
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
                assert(options.url.includes('/v6/deployments'));
                assert(options.headers['Authorization'].includes('Bearer'));

                return { data: mockDeployments };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data.result);
                assert(Array.isArray(data.result));
                assert(typeof data.count === 'number');
                assert.strictEqual(data.count, 2);
                assert.strictEqual(data.result.length, 2);
                assert.strictEqual(data.result[0].uid, 'dpl_test123');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should handle project filter', async () => {
        const projectId = 'test-project';
        const mockDeployments = {
            deployments: [
                {
                    uid: 'dpl_project_test',
                    name: 'project-deployment',
                    state: 'READY',
                    projectId: projectId
                }
            ],
            pagination: { count: 1, next: null, prev: null }
        };

        const context = {
            properties: {},
            messages: {
                in: {
                    content: {
                        projectId: projectId,
                        outputType: 'array'
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate that projectId is included in URL
                assert(options.url.includes(`projectId=${projectId}`));
                assert.strictEqual(options.method, 'GET');

                return { data: mockDeployments };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data.result);
                assert(Array.isArray(data.result));
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should handle state and target filters', async () => {
        const state = 'READY';
        const target = 'production';
        const mockDeployments = {
            deployments: [
                {
                    uid: 'dpl_filtered_test',
                    name: 'filtered-deployment',
                    state: state,
                    target: target
                }
            ],
            pagination: { count: 1, next: null, prev: null }
        };

        const context = {
            properties: {},
            messages: {
                in: {
                    content: {
                        state: state,
                        target: target,
                        outputType: 'array'
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate that filters are included in URL
                assert(options.url.includes(`state=${state}`));
                assert(options.url.includes(`target=${target}`));
                assert.strictEqual(options.method, 'GET');

                return { data: mockDeployments };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data.result);
                assert(Array.isArray(data.result));
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should generate output port options', async () => {
        const context = {
            properties: {
                generateOutputPortOptions: true
            },
            messages: {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            },
            CancelError: Error,
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(Array.isArray(data));
                assert(data.length > 0);
                assert(data[0].label);
                assert(data[0].value);
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });
});
